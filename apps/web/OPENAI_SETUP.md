# OpenAI Integration Setup Guide

## 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `sk-`)

## 2. Set Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your_actual_api_key_here

# Image Storage Configuration (choose one)
IMAGE_STORAGE_SERVICE=cloudinary

# Cloudinary Configuration (if using Cloudinary)
CLOUDINARY_URL=https://api.cloudinary.com/v1_1/your_cloud_name/image/upload
CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name

# AWS S3 Configuration (if using S3)
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_S3_BUCKET=your_bucket_name
# AWS_REGION=us-east-1
```

## 3. Choose Image Storage Service

### Option A: Cloudinary (Recommended)

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name from the dashboard
3. Create an upload preset:
   - Go to Settings > Upload
   - Create a new unsigned upload preset
   - Set folder to `daily-flashcard-images`
4. Update your environment variables with the Cloudinary URL and preset

### Option B: AWS S3

1. Create an AWS account
2. Create an S3 bucket
3. Set up IAM user with S3 permissions
4. Update your environment variables with AWS credentials

## 4. Production Deployment

### Vercel
Add the environment variables in your Vercel dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add each variable with the appropriate value

### Other Platforms
Add the environment variables through your hosting platform's dashboard or configuration files.

## 5. Testing

Once deployed, test the system by:
1. Going to the student page
2. The flashcard background should show a generated image
3. Check the browser console for any errors
4. Verify the image is being stored in your chosen service

## 6. Cost Considerations

- **OpenAI DALL-E 3**: ~$0.04 per image (1024x1024)
- **Cloudinary**: Free tier includes 25GB storage, 25GB bandwidth
- **AWS S3**: Very low cost for storage and bandwidth

## 7. Fallback Behavior

If OpenAI generation fails, the system will automatically:
1. Try to generate the image
2. If that fails, use one of the fallback static images
3. Log errors for debugging

## 8. Customization

You can customize the image generation by modifying the parameters in `generate-daily-image/route.ts`:

```typescript
{
  model: 'dall-e-3',           // or 'dall-e-2'
  size: '1024x1024',          // or '1792x1024', '1024x1792'
  quality: 'standard',        // or 'hd'
  style: 'natural'            // or 'vivid'
}
```
