import re

# A small predefined list of unethical keywords/phrases, grouped loosely by category
UNETHICAL_KEYWORDS = {
    "illegal hacking": [
        r"\bdDoS\b", r"\bhack into\b", r"\bsteal data\b", r"\bexploit vulnerability\b", 
        r"\bsql injection\b", r"\bmalware\b", r"\bransomware\b", r"\bphishing\b"
    ],
    "academic dishonesty": [
        r"\bdo my homework\b", r"\bwrite my essay\b", r"\btake my exam\b", 
        r"\bdo my assignment\b", r"\bcheat on\b", r"\bthesis writing service\b"
    ],
    "fraud/scams": [
        r"\bponzi\b", r"\bpyramid scheme\b", r"\bmoney laundering\b", 
        r"\bfake id\b", r"\bstolen credit card\b", r"\bcarding\b"
    ],
    "harassment": [
        r"\bdox\b", r"\bdoxxing\b", r"\bcyberbully\b", r"\btroll targeted\b", 
        r"\bharass\b", r"\bstalk\b"
    ],
    "fake engagement/reviews": [
        r"\bfake review\b", r"\bbot followers\b", r"\bbuy likes\b", 
        r"\bspam comments\b", r"\bfake engagement\b", r"\bmanipulate ratings\b",
        r"\bfake reviews\b"
    ],
    "counterfeit goods": [
        r"\bfake designer\b", r"\bcounterfeit\b", r"\bknockoff\b", 
        r"\breplica watches\b"
    ]
}

def check_bounty_ethics(title: str, description: str) -> bool:
    """
    Checks the job title and description against the unethical keyword list.
    Returns True if ethical, False if unethical.
    """
    combined_text = f"{title} {description}".lower()
    
    for category, keywords in UNETHICAL_KEYWORDS.items():
        for keyword_pattern in keywords:
            # Check for the pattern using word boundaries to avoid partial matches
            if re.search(keyword_pattern, combined_text, re.IGNORECASE):
                # Clean up the regex pattern for display
                display_keyword = keyword_pattern.replace(r'\b', '')
                print(f"[REJECTED] This bounty cannot be posted as it violates our ethical guidelines.")
                return False
                
    print(f"[ACCEPTED] Bounty posted successfully.\n")
    return True

def run_tests():
    print("--- Running Ethical Job Scanner Simulation ---\n")
    
    test_examples = [
        {
            "title": "Need a React Developer for E-commerce Site",
            "description": "We are looking for a frontend developer to build the UI for our new online store using React and Tailwind CSS."
        },
        {
            "title": "Urgent: Need to hack into an Instagram account",
            "description": "I forgot my password and need someone to hack into my ex's account to retrieve some photos. Willing to pay well."
        },
        {
            "title": "Write my essay on the French Revolution",
            "description": "I don't have time to do my homework. I need someone to write my essay of 2000 words. Plagiarism free please."
        },
        {
            "title": "Looking for data entry specialist",
            "description": "Simple data entry task. You will be provided with a spreadsheet of names and emails to copy into our CRM."
        },
        {
            "title": "Need 500 fake reviews for my new app",
            "description": "My app just launched on the App Store. I need someone to generate 500 5-star fake reviews to boost its ranking."
        },
        {
            "title": "Python Script for Web Scraping",
            "description": "Need a python expert to write a script that scrapes publicly available weather data from a government website every day."
        }
    ]
    
    for i, example in enumerate(test_examples, 1):
        print(f"Testing Job #{i}")
        print(f"Title: {example['title']}")
        print(f"Description: {example['description']}")
        print("-" * 40)
        check_bounty_ethics(example['title'], example['description'])

if __name__ == "__main__":
    run_tests()
