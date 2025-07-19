import { NextRequest, NextResponse } from 'next/server';
import { voiceSynthesisService } from '@/lib/voice-synthesis';

export async function GET(
  request: NextRequest,
  { params }: { params: { audioId: string } }
) {
  try {
    const { audioId } = params;

    if (!audioId) {
      return NextResponse.json(
        { error: 'Audio ID is required' },
        { status: 400 }
      );
    }

    // Get stored audio buffer
    const audioBuffer = voiceSynthesisService.getStoredAudio(audioId);

    if (!audioBuffer) {
      return NextResponse.json(
        { error: 'Audio not found or expired' },
        { status: 404 }
      );
    }

    // Return audio file
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error serving audio file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}