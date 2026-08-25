import cv2
import numpy as np
from sklearn.cluster import KMeans
from PIL import Image

def extract_colors(image_path :str, n_colors: int=3)-> list:
    #opening the cutout image
    image = Image.open(image_path).convert("RGBA")
    np_image = np.array(image)

    #only keeping the non-transparent pixels(the actual garment)
    alpha = np_image[:,:,3]
    garment_pixels = np_image[alpha>0][:,:3].astype(np.uint8) #rgb only

    if garment_pixels.size == 0:
        return []

    # Some cutouts legitimately contain only a tiny amount of garment material or
    # can be fully transparent if removal failed. KMeans requires at least one sample,
    # and it also cannot accept more clusters than available pixels.
    n_colors = min(max(1, n_colors), len(garment_pixels))

    #run k-means to find dominant colors
    kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
    kmeans.fit(garment_pixels)

    colors = kmeans.cluster_centers_.astype(np.uint8)

    #converting each color to HSV and hex
    result = []
    for color in colors:
        r,g,b = int(color[0]), int(color[1]), int(color[2])

        #convert to hsv
        bgr = np.array([[[b,g,r]]], dtype = np.uint8)
        hsv = cv2.cvtColor(bgr,cv2.COLOR_BGR2HSV)[0][0]

        result.append({
            "rgb" :[r,g,b],
            "hsv":[int(hsv[0]), int(hsv[1]), int(hsv[2])],
            "hex": f"#{r:02x}{g:02x}{b:02x}"
        })

    return result