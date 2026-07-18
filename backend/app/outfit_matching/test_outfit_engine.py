# quick test for outfit generation output

import json
import sys
from pathlib import Path

# add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.outfit_matching.engine import generate_outfits


def main():
    print("=" * 80)
    print("Testing outfit matching engine with dummy data...")
    print("=" * 80)
    
    occasions = ["Office", "Casual", "Party", "Date"]
    
    all_results = {}
    
    for occasion in occasions:
        print(f"\n[{occasion}]")
        result = generate_outfits(user_id="demo_user", occasion=occasion, top_k=5)
        all_results[occasion] = result
        
        print(f"  Message: {result['message']}")
        print(f"  Wardrobe size: {result['wardrobe_size_after_filter']}")
        print(f"  Outfits generated: {len(result['outfits'])}")
        
        for i, outfit in enumerate(result['outfits'], 1):
            garment_cats = ", ".join([g["category"] for g in outfit["garments"]])
            print(f"    {i}. [{garment_cats}] "
                  f"harmony={outfit['harmony_score']:.3f}, "
                  f"compat={outfit['compat_score']:.3f}, "
                  f"final={outfit['final_score']:.3f}")
    
    # write detailed json output
    output_file = Path(__file__).parent / "test_output.json"
    with open(output_file, "w") as f:
        json.dump(all_results, f, indent=2)
    
    print(f"\n✓ Detailed JSON output saved to: {output_file}")
    print("\nTo inspect results:")
    print(f"  cat {output_file}")


if __name__ == "__main__":
    main()
