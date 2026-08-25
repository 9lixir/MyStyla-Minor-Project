# test_classify.py

from app.classification.classify import analyze_garment

image_path = "processed/shirt-join-clothes-mao-collar-cotton-gauze-long-sleeves-regular-fit-grass-green_cutout.png"

result = analyze_garment(image_path)

print("=== TAGS ===")
for key, value in result["tags"].items():
    print(f"{key}: {value}")

print("\n=== EMBEDDING ===")
print(f"Length: {len(result['embedding'])}")
print(f"First 5 values: {result['embedding'][:5]}")