# Unsplash API Setup Guide

This guide will help you set up the Unsplash API to use stock images in PowerPoint generation instead of AI-generated images.

## Why Use Unsplash?

- ✅ **Free**: 50 requests per hour, 5,000 requests per month
- ✅ **High Quality**: Professional stock photos
- ✅ **Educational Content**: Great selection of educational and vocabulary-related images
- ✅ **Reliable**: No billing limits or quota issues like AI generation
- ✅ **Fast**: Quick image search and download

## Setup Steps

### 1. Create Unsplash Developer Account

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Click "Register as a developer"
3. Sign up with your email or GitHub account
4. Accept the API terms and conditions

### 2. Create a New Application

1. In your Unsplash developer dashboard, click "New Application"
2. Fill out the application form:
   - **Application name**: "Enchanted English PowerPoint Generator"
   - **Description**: "Educational PowerPoint generation with vocabulary images"
   - **Website URL**: `https://enchantedenglish.org`
3. Accept the API use case terms
4. Click "Create application"

### 3. Get Your API Key

1. After creating the application, you'll see your API credentials
2. Copy the **Access Key** (starts with something like `abc123...`)
3. Keep this key secure - don't share it publicly

### 4. Add API Key to Firebase Functions Environment

Since your Next.js API routes run in Firebase Functions, you need to add the API key to your Firebase Functions environment:

```bash
firebase functions:config:set unsplash.access_key="your_access_key_here"
```

### 5. Deploy the Changes

After adding the API key, redeploy your functions:

```bash
firebase deploy --only functions
```

**Note**: You may also need to redeploy hosting if the environment variables are used in the build process:

```bash
firebase deploy --only hosting
```

## API Limits

- **Free Tier**: 50 requests per hour, 5,000 requests per month
- **Rate Limiting**: If you exceed limits, you'll get a 403 error
- **Upgrade Options**: Available if you need higher limits

## Testing

Once set up, test the PowerPoint generation:

1. Go to the teacher dashboard
2. Open a student's lesson library
3. Click "Generate Powerpoint" for a lesson with vocabulary
4. Check the success message for image loading results

## Troubleshooting

### "Unsplash API key not configured"
- Make sure `UNSPLASH_ACCESS_KEY` is set in your environment variables
- Redeploy the application after adding the key

### "401 Unauthorized"
- Check that your API key is correct
- Verify the key is properly set in environment variables

### "403 Forbidden"
- You may have exceeded the rate limit
- Wait an hour and try again
- Consider upgrading your Unsplash plan

### "No images found"
- Some vocabulary words may not have suitable stock images
- The system will show "Image coming soon..." for failed words
- Try using more common or descriptive vocabulary words

## Benefits Over AI Generation

1. **No Billing Issues**: No OpenAI billing limits or quota problems
2. **Consistent Quality**: Professional stock photos vs. variable AI generation
3. **Faster**: No waiting for AI image generation
4. **Reliable**: No API downtime or service issues
5. **Cost Effective**: Free tier covers most educational use cases

## Alternative Stock Image APIs

If you need different options:

- **Pexels API**: Similar free tier, different image selection
- **Pixabay API**: Free with attribution required
- **Freepik API**: Premium service with free tier

## Support

If you encounter issues:
1. Check the Firebase Functions logs: `firebase functions:log`
2. Verify your API key is working: Test with a simple curl request
3. Check Unsplash API status: [status.unsplash.com](https://status.unsplash.com)
