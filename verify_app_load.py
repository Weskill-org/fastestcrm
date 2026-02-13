from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:8080")
            page.goto("http://localhost:8080", timeout=60000)
            print("Page loaded")

            # Wait for some content to load. Since we added lazy loading, it might take a moment.
            # We'll wait for network idle to be safe.
            page.wait_for_load_state("networkidle")

            # Take a screenshot
            page.screenshot(path="verification.png")
            print("Screenshot saved to verification.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
