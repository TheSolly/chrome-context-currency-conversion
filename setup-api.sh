#!/bin/bash

# Chrome Extension API Setup Script
# Helps set up API keys securely without committing them to git

echo "🔐 Chrome Currency Extension - Secure API Setup"
echo "=============================================="

# Check if template exists
if [ ! -f "utils/api-keys.local.js.template" ]; then
    echo "❌ Template file not found: utils/api-keys.local.js.template"
    exit 1
fi

# Check if local file already exists
if [ -f "utils/api-keys.local.js" ]; then
    echo "⚠️  Local API keys file already exists."
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Copy template
cp utils/api-keys.local.js.template utils/api-keys.local.js
echo "✅ Created utils/api-keys.local.js from template"

# Prompt for API key
echo ""
echo "📝 Please enter your ExchangeRate-API key:"
echo "   (Get it from: https://app.exchangerate-api.com/)"
read -p "API Key: " api_key

if [ -z "$api_key" ]; then
    echo "⚠️  No API key provided. You can edit utils/api-keys.local.js manually later."
else
    # Replace placeholder in the file
    if command -v sed >/dev/null 2>&1; then
        sed -i.bak "s/your-actual-api-key-here/$api_key/g" utils/api-keys.local.js
        rm utils/api-keys.local.js.bak 2>/dev/null
        echo "✅ API key configured successfully!"
    else
        echo "⚠️  Please manually replace 'your-actual-api-key-here' with your API key in utils/api-keys.local.js"
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo "   - Your API key is stored in utils/api-keys.local.js"
echo "   - This file is ignored by git and won't be committed"
echo "   - Load the extension in Chrome to start using it"
echo ""
echo "📖 For more information, see API_SETUP.md"
