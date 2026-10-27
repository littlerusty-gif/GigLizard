import { GoogleGenAI } from '@google/genai';

const BUFFER_GRAPHQL_ENDPOINT = 'https://api.buffer.com';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateVenueTip() {
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: 'Write a punchy, actionable production or live venue tip for independent music venues and touring bands under 200 characters. Start directly with "🦎 GigLizard Tip:" and include #LiveMusic #VenueManagement.',
  });

  const candidateText = response.candidates?.[0]?.content?.parts?.[0]?.text;
  const tip = (response.text || candidateText || '').trim();

  if (!tip) {
    console.warn('Gemini returned an empty string, using fallback tip.');
    return '🦎 GigLizard Tip: Advance your stage plots and input lists at least 48 hours before load-in to keep sound check on schedule! #LiveMusic #VenueManagement';
  }

  return tip;
}

async function scheduleBufferPost(text) {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  const channelId = process.env.BUFFER_CHANNEL_ID;

  if (!token || !channelId) {
    throw new Error('Missing BUFFER_ACCESS_TOKEN or BUFFER_CHANNEL_ID environment variables.');
  }

  const query = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
            status
          }
        }
        ... on MutationError {
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      channelId: channelId,
      text: text,
      schedulingType: 'automatic',
      mode: 'addToQueue',
      metadata: {
        facebook: {
          type: 'post'
        }
      }
    }
  };

  console.log(`Submitting tip to Buffer channel ${channelId}...`);

  const response = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Buffer API HTTP ${response.status}: ${errorBody}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    console.error('Buffer GraphQL Errors:', JSON.stringify(result.errors, null, 2));
    throw new Error(`GraphQL query error: ${result.errors[0].message}`);
  }

  const payload = result.data?.createPost;

  if (payload?.message) {
    throw new Error(`Buffer rejected post: ${payload.message}`);
  }

  const postId = payload?.post?.id;
  console.log(`Successfully queued post ID: ${postId}`);
  return result.data;
}

async function run() {
  try {
    console.log('Requesting tip from Gemini...');
    const tip = await generateVenueTip();
    console.log(`Generated Tip:\n${tip}\n`);

    await scheduleBufferPost(tip);
    console.log('Autopilot workflow finished successfully.');
  } catch (err) {
    console.error('❌ Action failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

run();
