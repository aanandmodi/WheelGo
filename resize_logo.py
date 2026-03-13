from PIL import Image
import os

def resize_image(image_path, output_path, size=(512, 512)):
    try:
        if not os.path.exists(image_path):
            print(f"Error: {image_path} does not exist.")
            return

        with Image.open(image_path) as img:
            print(f"Original size: {img.size}")
            print(f"Original mode: {img.mode}")
            
            # Create Teal Background (Primary Color from tailwind.config.js: #0F766E)
            # Size should be typical phone screen ratio to ensure it looks good, 
            # but Expo resizeMode='contain' helps. Let's make it a large vertical rectangle.
            splash_size = (1080, 1920)
            background = Image.new('RGB', splash_size, "#0F766E")
            
            # Resize logo to be reasonable (e.g. 40% of width)
            logo_width = int(splash_size[0] * 0.4)
            aspect_ratio = img.size[1] / img.size[0]
            logo_height = int(logo_width * aspect_ratio)
            img = img.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
            
            # Paste logo in center (slightly offset up to make room for text)
            logo_x = (splash_size[0] - logo_width) // 2
            logo_y = (splash_size[1] - logo_height) // 2 - 100 
            background.paste(img, (logo_x, logo_y), img)
            
            # Add Text
            # We need a font. Default might be too small/ugly.
            # Try to load a default fallback or basic font.
            try:
                from PIL import ImageDraw, ImageFont
                draw = ImageDraw.Draw(background)
                
                # Try simple paths for fonts on Windows
                font_path = "arial.ttf" 
                try:
                    font = ImageFont.truetype(font_path, 60)
                except IOError:
                    font = ImageFont.load_default()
                
                text = '"Your Ride, Your Way"'
                text_bbox = draw.textbbox((0, 0), text, font=font)
                text_width = text_bbox[2] - text_bbox[0]
                text_height = text_bbox[3] - text_bbox[1]
                
                text_x = (splash_size[0] - text_width) // 2
                text_y = logo_y + logo_height + 50 # 50px padding below logo
                
                draw.text((text_x, text_y), text, fill="white", font=font)
                
            except Exception as font_e:
                print(f"Font/Text error: {font_e}")

            # Save
            output_custom_path = r"d:\WheelGo\apps\customer\assets\images\splash-screen-design.png"
            background.save(output_custom_path, "PNG", optimize=True)
            print(f"Custom splash screen saved to {output_custom_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

# Paths
input_logo = r"d:\WheelGo\apps\customer\assets\images\logo.png"
output_splash = r"d:\WheelGo\apps\customer\assets\images\splash-logo.png"

# Resize both to be safe/consistent, or just splash
resize_image(input_logo, output_splash)
# resize_image(input_logo, input_logo) # Optional: resize main logo too?
