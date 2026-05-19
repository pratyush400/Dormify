import base64
import requests
import time
import io
from PIL import Image
from appium import webdriver
from appium.options.common import AppiumOptions
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# ── CONFIG ───────────────────────────────────────────────────────────────
OPENROUTER_API_KEY = "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"
OPENROUTER_MODEL   = "meta-llama/llama-3.2-11b-vision-instruct"  # free
APPIUM_SERVER      = "http://127.0.0.1:4723"

BUNDLE_ID          = "com.yourcompany.obo"   # update this
DEVICE_NAME        = "iPhone 15"             # your simulator name
PLATFORM_VERSION   = "17.0"                  # your iOS version
# ─────────────────────────────────────────────────────────────────────────


def get_driver():
    options = AppiumOptions()
    options.platform_name       = "iOS"
    options.automation_name     = "XCUITest"
    options.set_capability("bundleId",        BUNDLE_ID)
    options.set_capability("deviceName",      DEVICE_NAME)
    options.set_capability("platformVersion", PLATFORM_VERSION)
    options.set_capability("noReset",         True)
    options.set_capability("newCommandTimeout", 180)

    # Use simulator (set to False for real device)
    options.set_capability("isSimulator", True)

    return webdriver.Remote(APPIUM_SERVER, options=options)


def screenshot_as_base64(driver) -> str:
    png_bytes = driver.get_screenshot_as_png()
    img = Image.open(io.BytesIO(png_bytes))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def ask_llama(image_b64: str, question: str) -> str:
    """Send screenshot to OpenRouter and get visual validation."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://localhost",   # required by OpenRouter
        "X-Title":       "OBO App Validator"
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_b64}"
                        }
                    },
                    {
                        "type": "text",
                        "text": question
                    }
                ]
            }
        ],
        "max_tokens": 400
    }
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=30
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def find_and_tap_ios(driver, search_terms: list) -> bool:
    """iOS element finding — tries accessibility label, name, then value."""
    for term in search_terms:
        # By accessibility label (most reliable on iOS)
        try:
            el = driver.find_element(AppiumBy.ACCESSIBILITY_ID, term)
            el.click()
            print(f"  ✓ Tapped by accessibility ID: '{term}'")
            return True
        except Exception:
            pass

        # By visible text (XPath fallback)
        try:
            el = driver.find_element(
                AppiumBy.XPATH,
                f'//*[@label="{term}" or @name="{term}" or @value="{term}"]'
            )
            el.click()
            print(f"  ✓ Tapped by XPath label/name: '{term}'")
            return True
        except Exception:
            pass

        # Partial text match
        try:
            el = driver.find_element(
                AppiumBy.XPATH,
                f'//*[contains(@label,"{term}") or contains(@name,"{term}")]'
            )
            el.click()
            print(f"  ✓ Tapped by partial match: '{term}'")
            return True
        except Exception:
            pass

    return False


def handle_ios_permission_dialog(driver):
    """Handle iOS system permission dialogs (camera, microphone)."""
    print("  Checking for iOS system permission dialog...")
    time.sleep(1.5)

    # iOS permission dialog buttons
    permission_buttons = [
        "OK",
        "Allow",
        "Allow While Using App",
        "Don't Allow"   # swap to "Allow" logic below
    ]

    for btn in ["Allow", "Allow While Using App", "OK"]:
        try:
            # iOS alert buttons are in a special context
            alert_btn = driver.find_element(
                AppiumBy.XPATH,
                f'//XCUIElementTypeButton[@name="{btn}"]'
            )
            alert_btn.click()
            print(f"  ✓ Dismissed permission dialog with: '{btn}'")
            time.sleep(1)
            return True
        except Exception:
            pass

    print("  No permission dialog found (or already granted)")
    return False


def dump_page_source_elements(driver):
    """Print key UI elements to help identify accessibility IDs."""
    source = driver.page_source
    import re
    # Extract names and labels from page source for debugging
    names  = re.findall(r'name="([^"]+)"', source)
    labels = re.findall(r'label="([^"]+)"', source)
    unique = list(set(names + labels))[:20]
    print(f"  Visible elements: {unique}")


def validate_camera_feature(driver):
    results = []
    print("\n── iOS Camera Feature Validation ───────────────────")

    # 1. Verify app launched correctly
    print("\n[1] Verifying app launch...")
    time.sleep(3)
    img_b64 = screenshot_as_base64(driver)
    launch_check = ask_llama(img_b64,
        "This is an iOS app screenshot. Did the app launch successfully? "
        "Is it showing a login screen, home feed, or error screen? "
        "Answer in 2 sentences."
    )
    print(f"    → {launch_check}")
    results.append({"step": "app_launch", "response": launch_check})

    # 2. Dump elements to help find camera button
    print("\n[2] Scanning UI elements...")
    dump_page_source_elements(driver)

    # 3. Navigate to camera
    print("\n[3] Navigating to camera...")
    camera_terms = [
        "Camera", "camera", "Take Photo", "Photo", "Capture",
        "New Post", "Create", "+", "Add"
    ]
    found = find_and_tap_ios(driver, camera_terms)

    if not found:
        # Ask Llama to describe where the camera entry point is
        img_b64 = screenshot_as_base64(driver)
        hint = ask_llama(img_b64,
            "I need to find the camera or photo capture entry point in this iOS app. "
            "Look at the tab bar at the bottom and any buttons on screen. "
            "What is the exact label or position of the button I should tap to open the camera? "
            "Be specific — e.g. 'bottom tab bar, second icon from left' or 'plus button top right'."
        )
        print(f"    Llama hint: {hint}")
        results.append({"step": "camera_nav_hint", "response": hint})

    time.sleep(2)

    # 4. Handle iOS camera permission
    print("\n[4] Handling permissions...")
    handle_ios_permission_dialog(driver)
    time.sleep(2)

    # 5. Validate camera viewfinder
    print("\n[5] Validating camera screen...")
    img_b64 = screenshot_as_base64(driver)
    camera_validation = ask_llama(img_b64,
        "Does this iOS screenshot show an active camera viewfinder? "
        "Answer YES or NO first. Then check for these elements and list which are present:\n"
        "- Camera preview/viewfinder area\n"
        "- Circular shutter/capture button\n"
        "- Front/rear camera flip button\n"
        "- Flash or torch toggle\n"
        "- Close or back button\n"
        "- Any error messages or blank screens"
    )
    print(f"    → {camera_validation}")
    passed = camera_validation.strip().upper().startswith("YES")
    results.append({
        "step":     "camera_viewfinder",
        "passed":   passed,
        "response": camera_validation
    })

    # 6. Check for crashes or black screen
    print("\n[6] Checking for black screen or crash...")
    img_b64 = screenshot_as_base64(driver)
    crash_check = ask_llama(img_b64,
        "Is this screen completely black, showing a crash dialog, or an error alert? "
        "Answer YES (there is a problem) or NO (screen looks normal). "
        "One sentence explanation."
    )
    print(f"    → {crash_check}")
    is_crashed = "YES" in crash_check.upper()
    results.append({
        "step":     "crash_check",
        "passed":   not is_crashed,
        "response": crash_check
    })

    return results


def print_summary(results):
    print("\n── Test Summary ─────────────────────────────────────")
    all_passed = True
    for r in results:
        if "passed" in r:
            status = "✓ PASS" if r["passed"] else "✗ FAIL"
            if not r["passed"]:
                all_passed = False
        else:
            status = "ℹ INFO"
        print(f"  {status}  {r['step']}")
    print(f"\n  Overall: {'✓ ALL PASSED' if all_passed else '✗ SOME FAILURES'}")
    print("─────────────────────────────────────────────────────\n")


def main():
    print(f"Connecting to Appium at {APPIUM_SERVER}")
    print(f"Bundle ID: {BUNDLE_ID}")
    print(f"Device:    {DEVICE_NAME} (iOS {PLATFORM_VERSION})\n")

    driver = None
    try:
        driver = get_driver()
        print("✓ App launched successfully\n")
        results = validate_camera_feature(driver)
        print_summary(results)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if driver:
            driver.quit()
            print("Session closed.")


if __name__ == "__main__":
    main()