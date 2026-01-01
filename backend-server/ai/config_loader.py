import re
import os

def load_php_config(config_path):
    """
    Very simple parser to extract define() constants from PHP
    """
    configs = {}
    if not os.path.exists(config_path):
        return configs
        
    with open(config_path, 'r') as f:
        content = f.read()
        
    # Match define('KEY', 'VALUE');
    pattern = re.compile(r"define\s*\(\s*['\"](.+?)['\"]\s*,\s*['\"](.+?)['\"]\s*\)\s*;")
    matches = pattern.findall(content)
    
    for key, value in matches:
        configs[key] = value
        
    return configs

if __name__ == "__main__":
    # Test
    # print(load_php_config("../config/config.php"))
    pass
