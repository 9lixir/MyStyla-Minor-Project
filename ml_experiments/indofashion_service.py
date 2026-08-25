import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

# classification head architecture
class FashionClassifierHead(nn.Module):
    def __init__(self, input_dim=512, num_classes=15):
        super().__init__()
        self.classifier = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.classifier(x)


# production inference service
class IndoFashionService:
    def __init__(
        self, 
        model_path="ml_experiments/indofashion_head.pth", 
        model_name="patrickjohncyh/fashion-clip",
        id2label=None, 
        device=None, 
        temperature=1.2, 
        confidence_threshold=0.50
    ):
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # default 15 indo categories
        self.id2label = id2label or {
            0: 'blouse', 1: 'dhoti_pants', 2: 'dupattas', 3: 'gowns',
            4: 'kurta_men', 5: 'leggings_and_salwars', 6: 'lehenga', 7: 'mojaris_men',
            8: 'mojaris_women', 9: 'nehru_jackets', 10: 'palazzos', 11: 'petticoats',
            12: 'saree', 13: 'sherwanis', 14: 'women_kurta'
        }
        
        self.temperature = temperature
        self.confidence_threshold = confidence_threshold

        # loading backbone FashionCLIP model & processor
        self.clip_processor = CLIPProcessor.from_pretrained(model_name)
        self.clip_model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.clip_model.eval()

        #classification head weights
        self.head = FashionClassifierHead(input_dim=512, num_classes=len(self.id2label)).to(self.device)
        self.head.load_state_dict(torch.load(model_path, map_location=self.device))
        self.head.eval()

    def predict(self, image_input):
        if isinstance(image_input, str):
            image = Image.open(image_input).convert("RGB")
        else:
            image = image_input.convert("RGB")

        inputs = self.clip_processor(images=image, return_tensors="pt", padding=True).to(self.device)

        with torch.no_grad():
            outputs = self.clip_model.get_image_features(**inputs)
            
            # tensor unpacking
            if hasattr(outputs, "image_embeds") and outputs.image_embeds is not None:
                features = outputs.image_embeds
            elif hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                features = outputs.pooler_output
            elif isinstance(outputs, torch.Tensor):
                features = outputs
            else:
                features = outputs[0]

            # l2 normalization
            features = features / features.norm(dim=-1, keepdim=True)

            logits = self.head(features)
            
            # temperature scaling
            scaled_logits = logits / self.temperature
            probs = F.softmax(scaled_logits, dim=-1)

            confidence, pred_id = torch.max(probs, dim=-1)
            confidence_val = confidence.item()
            pred_class = self.id2label[pred_id.item()]

            is_flagged = confidence_val < self.confidence_threshold

        return {
            "prediction": pred_class,
            "confidence": round(confidence_val, 4),
            "flagged_low_confidence": is_flagged,
            "all_probabilities": {
                self.id2label[i]: round(probs[0][i].item(), 4) for i in range(len(self.id2label))
            }
        }