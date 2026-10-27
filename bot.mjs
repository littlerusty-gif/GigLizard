import { GoogleGenAI } from '@google/genai';

const BUFFER_GRAPHQL_ENDPOINT = 'https://api.buffer.com';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateVenueTip() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Generate a short, punchy daily venue and live production tip for GigLizard.',
    config: {
      systemInstruction: 'You are GigLizard. Write a punchy, actionable production/venue tip under 200 characters starting with "🦎 GigLizard Tip:". Include #LiveMusic #VenueManagement.',
      temperature: 0.7,
      maxOutputTokens: 100,
    }
  });

  const tip = response.text?.trim();
  if (!tip) throw new Error('Gemini API returned an empty response.');
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
        post {
          id
          status
        }
        userErrors {
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
      mode: 'addToQueue'
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

  const userErrors = result.data?.createPost?.userErrors;
  if (userErrors?.length) {
    console.error('Buffer UserErrors:', JSON.stringify(userErrors, null, 2));
    throw new Error(`Buffer rejected post: ${userErrors.map(e => e.message).join(', ')}`);
  }

  console.log(`Successfully queued post ID: ${result.data?.createPost?.post?.id}`);
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
