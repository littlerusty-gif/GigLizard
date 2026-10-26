#!/usr/bin/env node

/**
 * GigLizard Daily Social Autopilot Bot (bot.mjs)
 *
 * 1. Pulls 1 verified live music venue from Supabase public.venues.
 * 2. Uses Google Gemini (gemini-3.8-flash via @google/genai) to write a punchy DIY touring tip.
 * 3. Schedules the post to connected social channels (including TikTok) using
 *    Buffer's official GraphQL API (https://api.buffer.com) with the createPost mutation.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// 1. Environment & API Keys
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://papzanzgzoghrrgdzvfo.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_VVfSEHC_sej3qB_Qtxl5yA_fS1ZleG2';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BUFFER_ACCESS_TOKEN = process.env.BUFFER_ACCESS_TOKEN || process.env.BUFFER_TOKEN;
const BUFFER_CHANNEL_ID = process.env.BUFFER_CHANNEL_ID || process.env.BUFFER_PROFILE_ID;
const BUFFER_GRAPHQL_URL = 'https://api.buffer.com';

// Fallback media asset for TikTok (TikTok API requires media or draft/idea format)
const FALLBACK_MEDIA_URL = process.env.FALLBACK_MEDIA_URL || 'https://giglizard.us/og-image.png';
const TEXT_ONLY_DRAFT = process.env.TEXT_ONLY_DRAFT === 'true';
const DRY_RUN = process.env.DRY_RUN === 'true' || !BUFFER_ACCESS_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Step 1: Pull 1 verified venue from Supabase with smart date-based rotation.
 */
async function pullVerifiedVenue() {
  console.log('Connecting to Supabase public.venues...');
  
  // Get exact count of verified venues
  const { count, error: countErr } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .not('name', 'is', null)
    .not('city', 'is', null);

  if (countErr) {
    console.warn('Notice querying count from Supabase:', countErr.message);
  }

  const totalVenues = count && count > 0 ? count : 660;
  
  // Calculate a rotating offset so every morning features a different room
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const rotatingOffset = (dayOfYear * 7 + Math.floor(Math.random() * 5)) % totalVenues;

  console.log(`Querying 1 verified venue from database (Offset ${rotatingOffset} of ~${totalVenues})...`);

  const { data, error } = await supabase
    .from('venues')
    .select('id, name, city, state, address, capacity, genres_accepted, booking_email, website')
    .not('name', 'is', null)
    .not('city', 'is', null)
    .range(rotatingOffset, rotatingOffset)
    .limit(1);

  if (error || !data || data.length === 0) {
    console.warn('Falling back to top featured venue due to query notice:', error?.message);
    const { data: fallbackData } = await supabase
      .from('venues')
      .select('id, name, city, state, address, capacity, genres_accepted, booking_email, website')
      .not('name', 'is', null)
      .limit(1);

    if (fallbackData && fallbackData.length > 0) {
      return fallbackData[0];
    }

    // Ultimate fallback if Supabase is unreachable
    return {
      name: 'The Crocodile',
      city: 'Seattle',
      state: 'WA',
      capacity: 750,
      genres_accepted: ['Indie Rock', 'Punk', 'Hip-Hop'],
      booking_email: 'booking@thecrocodile.com',
      website: 'https://thecrocodile.com'
    };
  }

  return data[0];
}

/**
 * Step 2: Use Google Gemini (gemini-3.8-flash) to write a DIY touring tip.
 */
async function generateTouringTip(venue) {
  console.log(`Generating DIY touring tip for: "${venue.name}" in ${venue.city}, ${venue.state || 'USA'}...`);

  if (!GEMINI_API_KEY) {
    console.log('ℹ️ GEMINI_API_KEY not present in environment; generating via Little Rusty DIY touring playbook template.');
    const capacityText = venue.capacity ? `(${venue.capacity} cap)` : '';
    const genreList = Array.isArray(venue.genres_accepted) && venue.genres_accepted.length 
      ? venue.genres_accepted.slice(0, 3).join('/') 
      : 'Live music';

    const fallbackTemplates = [
      `📍 Venue Spotlight: ${venue.name} • ${venue.city}, ${venue.state} ${capacityText}\n\n🎸 DIY Touring Tip: Always include a 1-page stage plot and channel input patch list in your advance pitch. Venue audio engineers in ${venue.city} will treat your band like royalty.\n\nFree 650+ directory: https://www.giglizard.us/venues\n#DIYTouring #LiveMusic #GigLizard`,
      `📍 Stage Focus: ${venue.name} in ${venue.city}, ${venue.state} ${capacityText} • ${genreList}\n\n🚐 Road Tip: Never play ${venue.city} without a local co-bill swap. Swapping shows with local acts puts people in the room and splits van gas.\n\nVerified booking contacts: https://www.giglizard.us/venues\n#DIYTouring #IndependentMusic #GigLizard`,
      `📍 Room Spotlight: ${venue.name} (${venue.city}, ${venue.state})\n\n🎛️ Soundcheck Etiquette: Arrive 20 mins before load-in, shake hands with the house tech, confirm phantom power requirements, and keep changeovers under 15 mins.\n\nFind 650+ free stages: https://www.giglizard.us/venues\n#DIYTouring #LiveMusic #GigLizard`
    ];

    const idx = Math.abs((venue.name || '').length) % fallbackTemplates.length;
    return fallbackTemplates[idx];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `You are Little Rusty, a Pacific Northwest touring musician, sound engineer, and founder of GigLizard (a 100% free live music venue directory for DIY bands).

Write a short, engaging, and highly practical DIY touring tip post for social media (TikTok caption, Twitter/X, Threads, Instagram) spotlighting this venue for independent touring musicians:

Venue: ${venue.name}
Location: ${venue.city}, ${venue.state || 'USA'}
Capacity: ${venue.capacity ? `${venue.capacity} cap` : 'Independent stage'}
Genres: ${Array.isArray(venue.genres_accepted) && venue.genres_accepted.length ? venue.genres_accepted.join(', ') : 'Indie, Rock, Punk, Folk'}
Website: ${venue.website || 'Verified live room'}

Strict Guidelines:
1. Spotlight the venue respectfully as a real live room.
2. Provide ONE specific, actionable, golden DIY touring rule (e.g. advance lead times, routing corridor logic, patch list/stage plot prep, soundcheck etiquette, van security, or co-billing).
3. Voice: authentic working musician, zero corporate fluff, zero generic motivational clichés.
4. Keep the entire post under 280 characters if possible (maximum 320 characters).
5. Must include the link: https://www.giglizard.us/venues
6. End with hashtags: #DIYTouring #LiveMusic #GigLizard #BandLife

Return ONLY the raw post text without quotation marks or conversational commentary.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    const postText = response.text?.trim();
    if (postText && postText.length > 20) {
      return postText;
    }
    throw new Error('Gemini response was empty or too short.');
  } catch (err) {
    console.warn('Gemini API call failed, falling back to curated template:', err.message);
    return `📍 Venue Spotlight: ${venue.name} in ${venue.city}, ${venue.state} (${venue.capacity || 250} cap)\n\n🎸 DIY Tour Tip: Keep driving legs under 5 hours between stops and always advance sound specs with the talent buyer 3 weeks ahead.\n\nFree 650+ venue directory: https://www.giglizard.us/venues\n#DIYTouring #LiveMusic #GigLizard`;
  }
}

/**
 * Step 3: Fetch connected channels from Buffer GraphQL API if not provided in environment.
 */
async function resolveBufferChannelId() {
  if (BUFFER_CHANNEL_ID) {
    console.log(`Using configured Buffer Channel ID from environment: ${BUFFER_CHANNEL_ID}`);
    return BUFFER_CHANNEL_ID;
  }

  console.log('Querying Buffer GraphQL API for connected channels & organizations...');

  const orgsQuery = `
    query GetOrgs {
      account {
        organizations {
          id
          name
        }
      }
    }
  `;

  const orgsRes = await fetch(BUFFER_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: orgsQuery })
  });

  const orgsData = await orgsRes.json();
  if (orgsData.errors) {
    throw new Error(`Buffer GetOrgs error: ${orgsData.errors.map(e => e.message).join(', ')}`);
  }

  const orgs = orgsData.data?.account?.organizations;
  if (!orgs || orgs.length === 0) {
    throw new Error('No organizations found on Buffer account.');
  }

  const organizationId = orgs[0].id;
  console.log(`Using Organization: "${orgs[0].name}" (ID: ${organizationId})`);

  const channelsQuery = `
    query GetChannels($input: ChannelsInput!) {
      channels(input: $input) {
        id
        name
        displayName
        service
      }
    }
  `;

  const channelsRes = await fetch(BUFFER_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: channelsQuery,
      variables: { input: { organizationId } }
    })
  });

  const channelsData = await channelsRes.json();
  if (channelsData.errors) {
    throw new Error(`Buffer GetChannels error: ${channelsData.errors.map(e => e.message).join(', ')}`);
  }

  const channels = channelsData.data?.channels;
  if (!channels || channels.length === 0) {
    throw new Error(`No connected channels found in organization ${organizationId}.`);
  }

  console.log(`Discovered ${channels.length} connected channel(s):`);
  channels.forEach(c => console.log(` - ${c.service}: "${c.displayName || c.name}" (ID: ${c.id})`));

  // Prioritize TikTok channel if available
  const tikTokChannel = channels.find(c => c.service?.toLowerCase() === 'tiktok' || c.name?.toLowerCase().includes('tiktok'));
  if (tikTokChannel) {
    console.log(`🎯 Matched TikTok channel: "${tikTokChannel.displayName || tikTokChannel.name}" (ID: ${tikTokChannel.id})`);
    return tikTokChannel.id;
  }

  console.log(`Selecting primary channel: "${channels[0].displayName || channels[0].name}" (ID: ${channels[0].id})`);
  return channels[0].id;
}

/**
 * Step 4: Schedule via Buffer's official GraphQL API (https://api.buffer.com) using createPost mutation.
 */
async function scheduleToBuffer(postText, venue) {
  console.log('\n--- SOCIAL POST PREVIEW ---');
  console.log(postText);
  console.log('---------------------------\n');

  const hasMedia = !TEXT_ONLY_DRAFT && Boolean(FALLBACK_MEDIA_URL);

  console.log(`Media Configuration: ${hasMedia ? `Attached visual (${FALLBACK_MEDIA_URL})` : 'Strictly text (Idea/Draft mode)'}`);

  if (DRY_RUN || !BUFFER_ACCESS_TOKEN) {
    console.log('ℹ️ Running in DRY RUN mode (no BUFFER_ACCESS_TOKEN provided or DRY_RUN=true). Post was successfully generated but not submitted to Buffer.');
    return { success: true, dryRun: true };
  }

  const targetChannelId = await resolveBufferChannelId();

  // Official createPost GraphQL mutation as specified
  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
          }
        }
        ... on MutationError {
          message
        }
      }
    }
  `;

  // Build CreatePostInput
  // For TikTok:
  // - If media is attached, include AssetInput so TikTok API accepts the scheduled item.
  // - If scheduling strictly text, format as idea/draft (saveToDraft: true) instead of direct publish.
  const input = {
    channelId: targetChannelId,
    mode: 'addToQueue',
    schedulingType: 'automatic',
    needsApproval: false,
    text: postText,
    saveToDraft: hasMedia ? false : true,
    assets: hasMedia
      ? [
          {
            image: {
              url: FALLBACK_MEDIA_URL
            }
          }
        ]
      : [],
    metadata: {
      tiktok: {
        isAiGenerated: true,
        title: venue?.name ? `${venue.name} Tour Tip` : 'GigLizard Tour Tip'
      }
    }
  };

  console.log(`Executing createPost mutation via ${BUFFER_GRAPHQL_URL}...`);
  console.log(`Input payload: mode=${input.mode}, saveToDraft=${input.saveToDraft}, assets=${input.assets.length}`);

  const res = await fetch(BUFFER_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: mutation,
      variables: { input }
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Buffer GraphQL HTTP error ${res.status}: ${errorText}`);
  }

  const result = await res.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(`Buffer GraphQL error: ${result.errors.map(e => e.message).join(', ')}`);
  }

  const createPostResult = result.data?.createPost;

  // Check for MutationError
  if (createPostResult?.message) {
    throw new Error(`Buffer MutationError: ${createPostResult.message}`);
  }

  // Check for PostActionSuccess
  if (createPostResult?.post?.id) {
    console.log(`✅ Successfully queued to Buffer via GraphQL! Post ID: ${createPostResult.post.id}`);
    return createPostResult;
  }

  console.log('Buffer GraphQL response:', JSON.stringify(createPostResult, null, 2));
  return createPostResult;
}

/**
 * Main execution routine.
 */
async function main() {
  console.log('======================================================');
  console.log(' GigLizard Daily Social Autopilot Bot (Buffer GraphQL)');
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log('======================================================\n');

  try {
    // 1. Pull 1 venue from Supabase
    const venue = await pullVerifiedVenue();
    console.log(`✅ Selected Venue: ${venue.name} (${venue.city}, ${venue.state || 'US'})`);

    // 2. Generate DIY Touring Tip via Gemini
    const postText = await generateTouringTip(venue);

    // 3. Schedule via Buffer GraphQL API
    await scheduleToBuffer(postText, venue);

    console.log('\n🎉 Autopilot run complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Autopilot bot encountered an error:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
