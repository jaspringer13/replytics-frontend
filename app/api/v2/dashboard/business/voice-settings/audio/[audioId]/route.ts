import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { voiceSynthesisService } from '@/lib/voice-synthesis';

export async function GET(
  request: NextRequest,
  { params }: { params: { audioId: string } }
) {
  try {
    // Add authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audioId } = params;

    if (!audioId) {
      return NextResponse.json(
        { error: 'Audio ID is required' },
        { status: 400 }
      );
    }

    // Validate audioId format (e.g., UUID pattern)
    if (!/^[a-fA-F0-9-]{36}$/.test(audioId)) {
      return NextResponse.json(
        { error: 'Invalid audio ID format' },
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

    // Get audio format and return file
    const contentType = voiceSynthesisService.getAudioFormat(audioId) || 'audio/mpeg';
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Content-Disposition': `inline; filename="audio-${audioId}.mp3"`,
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