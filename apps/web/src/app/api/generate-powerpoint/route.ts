import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';
import { Storage } from '@google-cloud/storage';
import { adminDb } from '@/lib/firebaseAdmin';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'raystutorsite',
});

const bucketName = 'raystutorsite-powerpoints';

export async function POST(request: NextRequest) {
  try {
    const { studentId, lessonId, vocabularyWords, lessonTopic } = await request.json();

    if (!studentId || !lessonId || !vocabularyWords || !Array.isArray(vocabularyWords)) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, lessonId, vocabularyWords' },
        { status: 400 }
      );
    }

    if (vocabularyWords.length === 0) {
      return NextResponse.json(
        { error: 'At least one vocabulary word is required' },
        { status: 400 }
      );
    }

    console.log(`Generating PowerPoint for lesson ${lessonId} with ${vocabularyWords.length} vocabulary words`);

    // Create a new PowerPoint presentation
    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = 'Enchanted English';
    pptx.company = 'Enchanted English';
    pptx.title = `Vocabulary: ${lessonTopic}`;
    pptx.subject = 'English Vocabulary Learning';

    // Generate slides for each vocabulary word
    const imageGenerationResults = [];
    
    for (let i = 0; i < vocabularyWords.length; i++) {
      const word = vocabularyWords[i].trim();
      if (!word) continue;

      console.log(`\n=== Generating slide ${i + 1} for word: "${word}" ===`);

      // Generate AI image for the vocabulary word
      let imageUrl = '';
      let imageData = null;
      let imageGenerationSuccess = false;
      
      try {
        console.log(`🖼️ Starting stock image search for "${word}"...`);
        const startTime = Date.now();
        
        // Use Unsplash API to get a relevant stock image
        const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY;
        if (!unsplashApiKey) {
          console.warn(`⚠️ Unsplash API key not configured for "${word}" - using placeholder`);
          throw new Error('Unsplash API key not configured');
        }
        
        const unsplashResponse = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(word)}&per_page=1&orientation=landscape&client_id=${unsplashApiKey}`
        );

        const generationTime = Date.now() - startTime;
        console.log(`⏱️ Stock image search took ${generationTime}ms for "${word}"`);

        if (unsplashResponse.ok) {
          const unsplashData = await unsplashResponse.json();
          console.log(`📊 Unsplash response for "${word}":`, {
            total: unsplashData.total,
            results: unsplashData.results?.length || 0,
            searchTime: `${generationTime}ms`
          });

          if (unsplashData.results && unsplashData.results.length > 0) {
            const photo = unsplashData.results[0];
            imageUrl = photo.urls.regular; // Use regular size (1080px width)
            console.log(`✅ Found stock image URL for "${word}": ${imageUrl}`);
            
            // Download and convert image to base64
            console.log(`📥 Downloading stock image for "${word}"...`);
            const downloadStartTime = Date.now();
            
            const imageDownloadResponse = await fetch(imageUrl);
            if (imageDownloadResponse.ok) {
              const imageBuffer = await imageDownloadResponse.arrayBuffer();
              const base64Image = Buffer.from(imageBuffer).toString('base64');
              const mimeType = imageDownloadResponse.headers.get('content-type') || 'image/jpeg';
              const dataUrl = `data:${mimeType};base64,${base64Image}`;
              
              const downloadTime = Date.now() - downloadStartTime;
              console.log(`✅ Downloaded and converted stock image for "${word}" in ${downloadTime}ms (${base64Image.length} chars)`);
              
              imageData = dataUrl;
              imageGenerationSuccess = true;
            } else {
              console.error(`❌ Failed to download stock image for "${word}": HTTP ${imageDownloadResponse.status}`);
            }
          } else {
            console.warn(`⚠️ No stock images found for "${word}"`);
          }
        } else {
          console.error(`❌ Unsplash API error for "${word}": HTTP ${unsplashResponse.status}`);
          if (unsplashResponse.status === 401) {
            console.error(`🔑 Unsplash API key may be invalid or missing`);
          }
        }
      } catch (imageError) {
        console.error(`❌ Failed to search/download stock image for "${word}":`, imageError);
        console.error(`Error details:`, {
          message: imageError instanceof Error ? imageError.message : String(imageError),
          stack: imageError instanceof Error ? imageError.stack : undefined,
          name: imageError instanceof Error ? imageError.name : 'Unknown'
        });
      }

      // Store result for this word
      imageGenerationResults.push({
        word,
        success: imageGenerationSuccess,
        imageData,
        imageUrl,
        slideIndex: i
      });

      // Create slide
      const slide = pptx.addSlide();

      // Choose a random template style
      const templates = [
        { bgColor: 'FFFFFF', textColor: '1F2937' }, // White background, dark text
        { bgColor: 'F3F4F6', textColor: '1F2937' }, // Light gray background
        { bgColor: 'EFF6FF', textColor: '1E40AF' }, // Light blue background
        { bgColor: 'F0FDF4', textColor: '166534' }, // Light green background
        { bgColor: 'FEF3C7', textColor: '92400E' }, // Light yellow background
        { bgColor: 'FCE7F3', textColor: 'BE185D' }, // Light pink background
      ];
      
      const template = templates[Math.floor(Math.random() * templates.length)];
      slide.background = { color: template.bgColor };

      // Add title (vocabulary word)
      slide.addText(word, {
        x: 1,
        y: 0.5,
        w: 8,
        h: 1.5,
        fontSize: 48,
        bold: true,
        color: template.textColor,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
      });

      // Add image if generated successfully
      if (imageGenerationSuccess && imageData) {
        try {
          console.log(`🖼️ Adding image to slide for "${word}"...`);
          
          slide.addImage({
            data: imageData,
            x: 2,
            y: 2.5,
            w: 6,
            h: 4,
            sizing: {
              type: 'contain',
              w: 6,
              h: 4,
            },
          });
          
          console.log(`✅ Successfully added image to slide for "${word}"`);
        } catch (imageError) {
          console.error(`❌ Failed to add image to slide for "${word}":`, imageError);
          console.error(`Image data length: ${imageData?.length || 0} characters`);
          
          // Add placeholder text if image fails
          slide.addText('Image coming soon...', {
            x: 2,
            y: 3.5,
            w: 6,
            h: 2,
            fontSize: 24,
            color: template.textColor,
            align: 'center',
            valign: 'middle',
            fontFace: 'Arial',
          });
        }
      } else {
        // Add placeholder text if no image
        console.log(`⚠️ No image available for "${word}", adding placeholder text`);
        slide.addText('Image coming soon...', {
          x: 2,
          y: 3.5,
          w: 6,
          h: 2,
          fontSize: 24,
          color: template.textColor,
          align: 'center',
          valign: 'middle',
          fontFace: 'Arial',
        });
      }

      // Add lesson topic at the bottom
      slide.addText(`Lesson: ${lessonTopic}`, {
        x: 1,
        y: 7,
        w: 8,
        h: 0.5,
        fontSize: 16,
        color: template.textColor,
        align: 'center',
        fontFace: 'Arial',
      });
    }

    // Log summary of stock image search results
    const successfulImages = imageGenerationResults.filter(r => r.success).length;
    const failedImages = imageGenerationResults.filter(r => !r.success).length;
    
    console.log(`\n📊 Stock Image Search Summary:`);
    console.log(`✅ Successful: ${successfulImages}/${vocabularyWords.length}`);
    console.log(`❌ Failed: ${failedImages}/${vocabularyWords.length}`);
    
    if (failedImages > 0) {
      console.log(`❌ Failed words:`, imageGenerationResults.filter(r => !r.success).map(r => r.word));
    }

    // Generate the PowerPoint file
    console.log(`\n📄 Generating PowerPoint file...`);
    const buffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer;
    console.log(`✅ PowerPoint generated successfully (${buffer.byteLength} bytes)`);

    // Upload to Google Cloud Storage
    const fileName = `powerpoints/${studentId}/${lessonId}-${Date.now()}.pptx`;
    const file = storage.bucket(bucketName).file(fileName);
    
    await file.save(Buffer.from(buffer as ArrayBuffer), {
      metadata: {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const powerpointUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    // Save the PowerPoint URL to the lesson's powerpoint in Firestore
    try {
      const lessonRef = adminDb.collection('users').doc(studentId).collection('lessons').doc(lessonId);
      const lessonDoc = await lessonRef.get();
      
      if (lessonDoc.exists) {
        const lessonData = lessonDoc.data();
        const currentPowerpoint = lessonData?.powerpoint || [];
        
        // Add the new PowerPoint URL to powerpoint
        const updatedPowerpoint = [...currentPowerpoint, powerpointUrl];
        
        await lessonRef.update({
          powerpoint: updatedPowerpoint,
          updatedAt: new Date().toISOString(),
        });
        
        console.log(`Updated lesson ${lessonId} with PowerPoint URL: ${powerpointUrl}`);
      }
    } catch (firestoreError) {
      console.error('Failed to update lesson with PowerPoint URL:', firestoreError);
      // Continue even if Firestore update fails
    }

    return NextResponse.json({
      success: true,
      powerpointUrl,
      message: `PowerPoint generated successfully with ${vocabularyWords.length} slides`,
      imageSearchSummary: {
        total: vocabularyWords.length,
        successful: successfulImages,
        failed: failedImages,
        successRate: `${Math.round((successfulImages / vocabularyWords.length) * 100)}%`,
        imageSource: 'Unsplash Stock Photos'
      },
      failedWords: imageGenerationResults.filter(r => !r.success).map(r => r.word)
    });

  } catch (error) {
    console.error('Error generating PowerPoint:', error);
    return NextResponse.json(
      { error: 'Failed to generate PowerPoint' },
      { status: 500 }
    );
  }
}
