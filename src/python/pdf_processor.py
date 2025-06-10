import fitz  # PyMuPDF
import os
import re
import json
from PIL import Image
import io


def extract_personal_section(text, image_paths=None):
    # Clean and prepare the text
    text = text.replace("\r", "").replace("\u200b", "")  # Remove special chars
    result = {
        "fcn_id": "",
        "name_am": "",
        "name_en": "",
        "dob_ethiopian": "",
        "dob_gregorian": "",
        "city_am": "",
        "city_en": "",
        "gender_am": "",
        "gender_en": "",
        "sub_city_am": "",
        "sub_city_en": "",
        "nationality_am": "",
        "nationality_en": "",
        "woreda_am": "",
        "woreda_en": "",
        "phone": "",
        "images": {},
    }

    # Check which format we're dealing with
    if "ማሳሰቢያ፡ ለእርስዎ አገልገሎት ብቻ!" in text:
        # FORMAT 2: Fields appear after disclaimer
        return extract_format2(text, image_paths)
    else:
        # FORMAT 1: Original structured format
        return extract_format1(text, image_paths)


def extract_format1(text, image_paths):
    """Handle the original structured format with both pipe-separated and regex fallback"""
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    result = {}

    # Format A: Pipe-separated lines (new format)
    if len(lines) >= 9 and "|" in lines[1]:
        try:
            result = {
                "fcn_id": lines[0],
                "name_am": lines[1].split("|")[0].strip(),
                "name_en": lines[1].split("|")[1].strip(),
                "dob_ethiopian": lines[2].split("|")[0].strip(),
                "dob_gregorian": lines[2].split("|")[1].strip(),
                "gender_am": lines[3].split("|")[0].strip(),
                "gender_en": lines[3].split("|")[1].strip(),
                "nationality_am": lines[4].split("|")[0].strip(),
                "nationality_en": lines[4].split("|")[1].strip(),
                "phone": lines[5],
                "city_am": lines[6].split("|")[0].strip(),
                "city_en": lines[6].split("|")[1].strip(),
                "sub_city_am": lines[7].split("|")[0].strip(),
                "sub_city_en": lines[7].split("|")[1].strip(),
                "woreda_am": lines[8].split("|")[0].strip(),
                "woreda_en": lines[8].split("|")[1].strip(),
            }
        except (IndexError, ValueError):
            return {}
    else:
        # Format B: Regex fallback
        pattern = re.compile(
            r"""
            (?P<fcn_id>\d{16})\s*\n
            (?P<name_am>.+?)\s*\n
            (?P<name_en>.+?)\s*\n
             (?P<dob_ethiopian>\d{2}/\d{2}/\d{4})\s*[\|∶]?\s*(?P<dob_gregorian>\d{4}/\d{2}/\d{2})?\s*\n
            (?P<city_am>.+?)\s*\n
            (?P<city_en>.+?)\s*\n
            (?P<gender_am>.+?)\s*\n
            \|\s*(?P<gender_en>.+?)\s*\n
            (?P<sub_city_am>.+?)\s*\n
            (?P<sub_city_en>.+?)\s*\n
            (?P<nationality_am>.+?)\s*\n
            (?P<nationality_en>.+?)\s*\n
            (?P<woreda_am>.+?)\s*\n
            (?P<woreda_en>.+?)\s*\n
            (?P<phone>\d{10})""",
            re.VERBOSE,
        )

        match = pattern.search(text)
        if match:
            result = match.groupdict()
        else:
            return {}

    # Attach images
    if image_paths:
        result["images"] = {str(i): path for i, path in enumerate(image_paths)}
    else:
        result["images"] = {}

    return result


def extract_format2(text, image_paths):
    """Handle the alternative format with fields after disclaimer"""
    result = {
        "fcn_id": "",
        "name_am": "",
        "name_en": "",
        "dob_ethiopian": "",
        "dob_gregorian": "",
        "city_am": "",
        "city_en": "",
        "gender_am": "",
        "gender_en": "",
        "sub_city_am": "",
        "sub_city_en": "",
        "nationality_am": "",
        "nationality_en": "",
        "woreda_am": "",
        "woreda_en": "",
        "phone": "",
        "images": {},
    }

    # Find the starting point after the disclaimer
    disclaimer_index = text.find("ማሳሰቢያ፡ ለእርስዎ አገልገሎት ብቻ!")
    if disclaimer_index == -1:
        return result

    # Extract the personal data section after the disclaimer
    personal_data = text[disclaimer_index + len("ማሳሰቢያ፡ ለእርስዎ አገልገሎት ብቻ!") :]
    lines = [line.strip() for line in personal_data.split("\n") if line.strip()]

    try:
        # The fields appear in this specific order after the disclaimer
        if len(lines) >= 16:  # Ensure we have enough lines
            result["dob_ethiopian"] = lines[0]
            result["dob_gregorian"] = lines[1]
            result["gender_am"] = lines[2]
            result["gender_en"] = lines[3]
            result["nationality_am"] = lines[4]
            result["nationality_en"] = lines[5]
            result["phone"] = lines[6]
            result["city_am"] = lines[7]
            result["city_en"] = lines[8]
            result["sub_city_am"] = lines[9]
            result["sub_city_en"] = lines[10]
            result["woreda_am"] = lines[11]
            result["woreda_en"] = lines[12]
            result["fcn_id"] = lines[13]
            result["name_am"] = lines[14]
            result["name_en"] = lines[15]
    except IndexError:
        pass  # Handle cases where some fields might be missing

    # Attach images if provided
    if image_paths:
        result["images"] = {str(i): path for i, path in enumerate(image_paths)}

    return result

def remove_white_background(img: Image.Image, threshold=240) -> Image.Image:
    """Convert near-white pixels to transparent."""
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # item = (R, G, B, A)
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            newData.append((255, 255, 255, 0))  # Transparent
        else:
            newData.append(item)

    img.putdata(newData)
    return img

def extract_from_pdf_as_json(pdf_path, output_folder):
    doc = fitz.open(pdf_path)
    os.makedirs(output_folder, exist_ok=True)

    results = []

    for page_num, page in enumerate(doc):
        text = page.get_text()
        cleaned_text = text.replace(" ", "")
        fcn_match = re.search(r'(\d{16})', cleaned_text)
        fcn_id = fcn_match.group(1) if fcn_match else f"page{page_num+1}"
        
        with open("output.txt", "w", encoding="utf-8") as file:
            file.write(text)

        # Extract and save images
        image_paths = []
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
             # Load and convert image
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("L")  # Grayscale
            rgba_img = pil_img.convert("RGBA")  # Required before making transparent
            no_bg_img = remove_white_background(rgba_img)
            
            pil_img = Image.open(io.BytesIO(image_bytes))
            # bw_image = pil_img.convert("L")
            image_filename = f"img_{fcn_id}_{img_index+1}.png"
            image_path = os.path.join(output_folder, image_filename)
            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)
            no_bg_img.save(image_path)
            image_paths.append(f"images/{image_filename}")

        # Extract personal info
        personal_info = extract_personal_section(text, image_paths=image_paths)

        if personal_info:
            results.append(personal_info)
        else:
            print(f"No personal info found on page {page_num+1}")

    return results


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: python script.py <pdf_path> <output_folder>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_folder = sys.argv[2]

    results = extract_from_pdf_as_json(pdf_path, output_folder)

    # Output the JSON result to stdout so Node.js can capture it
    print(json.dumps(results, ensure_ascii=False))
