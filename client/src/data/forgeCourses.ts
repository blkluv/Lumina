import { Video, Wallet, Coins, Heart, LucideIcon } from "lucide-react";

export interface Lesson {
  id: number;
  title: string;
  duration: string;
  overview: string;
  keyTakeaways: string[];
  content?: string; // Full lesson content in markdown format
}

export interface CourseContent {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  lessons: Lesson[];
  totalDuration: string;
  level: number;
  badge: string;
  prerequisites: string[];
  learningOutcomes: string[];
  onchainId?: number;
}

export interface CourseCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  description: string;
  courses: number[];
}

export const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const COURSE_CONTENT: Record<number, CourseContent> = {
  // ============================================
  // CREATOR FOUNDATIONS TRACK
  // ============================================
  101: {
    id: 101,
    title: "Content That Connects",
    description: "Learn to create viral short-form videos that resonate with your audience",
    longDescription: "Master the art of creating compelling short-form video content that captures attention, sparks emotion, and drives engagement. From ideation to execution, learn the secrets behind viral content that builds lasting connections with your audience.",
    totalDuration: "2 hours",
    level: 0,
    badge: "Creator I",
    prerequisites: [],
    learningOutcomes: [
      "Understand the psychology behind viral content",
      "Master hook techniques that capture attention in the first 3 seconds",
      "Create emotionally resonant stories that drive shares",
      "Develop a consistent content creation workflow"
    ],
    lessons: [
      {
        id: 1,
        title: "The Anatomy of Viral Content",
        duration: "15 min",
        overview: "Discover what makes content spread. We'll analyze successful viral videos and identify the common patterns that make people hit share.",
        keyTakeaways: [
          "The 5 emotional triggers that drive sharing",
          "Pattern recognition in viral content",
          "Understanding the algorithm's preferences"
        ],
        content: `## What Makes Content Go Viral?

Viral content isn't random luck—it follows predictable patterns. After analyzing thousands of viral videos across platforms, researchers have identified key elements that dramatically increase shareability.

### The 5 Emotional Triggers

**1. Awe & Wonder**
Content that makes people say "wow" gets shared. This could be an incredible talent, a beautiful scene, or an unexpected twist. Think: amazing transformations, skills showcased, or mind-blowing facts.

**2. Joy & Humor**
People love to spread happiness. Funny content that makes viewers laugh out loud is among the most shared. The key is relatability—humor that reflects common experiences.

**3. Inspiration & Hope**
Uplifting stories about overcoming challenges, achieving dreams, or acts of kindness spread quickly. People share to inspire others and associate themselves with positive messages.

**4. Surprise & Curiosity**
Unexpected twists, reveals, and "wait for it" moments keep viewers engaged and compel them to share. The element of surprise breaks pattern recognition.

**5. Social Currency**
People share content that makes them look good—informed, trendy, or helpful. Educational content and insider tips spread because sharing elevates the sharer's status.

### Pattern Recognition

Study viral content in your niche:
- What emotions does it trigger?
- What's the pacing like?
- How quickly does it hook you?
- What makes you want to share it?

### Algorithm Basics

Modern algorithms prioritize:
- **Watch time**: How long people stay watching
- **Engagement**: Likes, comments, shares, saves
- **Retention**: Do people watch to the end?
- **Replays**: Content people watch multiple times

🔥 **Action Step**: Save 10 viral videos in your niche. Analyze what emotional trigger each one uses.`
      },
      {
        id: 2,
        title: "Crafting the Perfect Hook",
        duration: "15 min",
        overview: "You have 3 seconds to capture attention. Learn proven hook formulas that stop the scroll and compel viewers to watch.",
        keyTakeaways: [
          "10 hook templates that work every time",
          "Visual vs verbal hooks",
          "Testing and iterating on hooks"
        ],
        content: `## The 3-Second Rule

You have exactly 3 seconds to capture attention before someone scrolls past. Your hook is the single most important element of your content.

### 10 Hook Templates That Work

**1. The Bold Statement**
"Nobody talks about this, but..."
"This changed everything for me..."

**2. The Question Hook**
"What would you do if...?"
"Did you know that...?"

**3. The Controversy**
"Unpopular opinion: ..."
"I'm going to say what everyone's thinking..."

**4. The Promise**
"By the end of this video, you'll know..."
"I'm about to show you exactly how..."

**5. The Story Opener**
"So this happened yesterday..."
"I never thought I'd share this, but..."

**6. The Pattern Interrupt**
Start with an unusual visual or sound
Break expectations immediately

**7. The Relatability**
"POV: When you..."
"Tell me you're a [type] without telling me..."

**8. The Urgency**
"Stop scrolling if you..."
"You need to hear this..."

**9. The Social Proof**
"Millions of people don't know this..."
"The secret that [experts] don't want you to know..."

**10. The Demonstration**
Start with the end result
Show the transformation immediately

### Visual vs Verbal Hooks

**Visual Hooks**: Movement, bright colors, close-ups, unexpected imagery
**Verbal Hooks**: First words, tone of voice, pacing

The best content uses BOTH simultaneously.

### Testing Your Hooks

- Create 3 different hooks for the same content
- Post at similar times
- Measure which gets highest retention
- Double down on what works

🔥 **Action Step**: Write 5 different hooks for your next piece of content. Test them with friends before posting.`
      },
      {
        id: 3,
        title: "Storytelling in 60 Seconds",
        duration: "20 min",
        overview: "Master the micro-storytelling format. Learn to compress compelling narratives into bite-sized content that leaves impact.",
        keyTakeaways: [
          "The 3-act structure for short content",
          "Creating tension and resolution quickly",
          "Using visual storytelling techniques"
        ],
        content: `## The Art of Micro-Storytelling

Great stories follow the same structure whether they're 2 hours or 60 seconds. The key is compression—every second must count.

### The 3-Act Structure (Compressed)

**Act 1: Setup (0-10 seconds)**
- Introduce the character/situation
- Establish stakes immediately
- Create curiosity

**Act 2: Conflict (10-45 seconds)**
- Present the challenge
- Build tension
- Show the struggle

**Act 3: Resolution (45-60 seconds)**
- Payoff the setup
- Deliver the punchline/lesson
- End with impact

### Creating Tension Quickly

Tension = the gap between expectation and reality

Ways to create tension:
- **Time pressure**: "I only had 24 hours..."
- **Stakes**: "If this didn't work, I'd lose everything..."
- **Mystery**: "What I found shocked me..."
- **Conflict**: "They said it couldn't be done..."

### Visual Storytelling Techniques

**Show, Don't Tell**
Instead of saying "I was nervous," show shaky hands or pacing.

**Use B-Roll**
Cut between talking and showing the action.

**Facial Expressions**
Close-ups of genuine reactions create emotional connection.

**Transitions as Story Elements**
Use cuts, zooms, and transitions to emphasize story beats.

### The Power of Specificity

Generic: "I started a business"
Specific: "I turned $47 into a six-figure business from my mom's garage"

Details make stories believable and memorable.

🔥 **Action Step**: Take one of your experiences and write it as a 60-second story using the 3-act structure. Time yourself reading it aloud.`
      },
      {
        id: 4,
        title: "Emotional Resonance",
        duration: "15 min",
        overview: "Content that makes people feel gets shared. Understand how to authentically connect with your audience's emotions.",
        keyTakeaways: [
          "Mapping emotional journeys",
          "Authenticity vs performance",
          "Building parasocial connections"
        ],
        content: `## Making People Feel

The content people remember isn't what made them think—it's what made them *feel*. Emotional resonance is your superpower.

### Mapping Emotional Journeys

Every piece of content should take viewers on an emotional journey:

**The Rollercoaster Method**
1. Start with a relatable low point
2. Build hope through the middle
3. Deliver an emotional high at the end

**The Surprise Method**
1. Set up one expectation
2. Subvert it completely
3. Land on an unexpected emotion

### Authenticity vs Performance

**Authenticity Wins**
- Imperfect moments feel real
- Vulnerability creates connection
- Share genuine struggles, not just wins

**The Performance Trap**
- Overly polished = unrelatable
- Fake emotions are obvious
- Trying too hard pushes people away

**Finding the Balance**
Be intentional about *what* you share, but genuine in *how* you share it.

### Building Parasocial Connections

Parasocial = one-sided relationships where viewers feel they know you

How to build it:
- **Consistency**: Show up regularly
- **Intimacy**: Share personal details appropriately
- **Direct address**: Talk TO your audience, not AT them
- **Callbacks**: Reference past content and inside jokes
- **Responsiveness**: Reply to comments, acknowledge your community

### The Mirror Effect

People are drawn to content that reflects their own experiences:
- "This is SO me"
- "I thought I was the only one"
- "Finally someone said it"

Create content that makes people feel seen and understood.

🔥 **Action Step**: Write down 3 genuine struggles you've overcome. These are your most powerful content topics.`
      },
      {
        id: 5,
        title: "Visual Excellence on Any Budget",
        duration: "15 min",
        overview: "You don't need expensive equipment to create stunning content. Learn smartphone filming techniques and free editing tools.",
        keyTakeaways: [
          "Lighting with natural light",
          "Smartphone camera settings",
          "Free editing apps and techniques"
        ],
        content: `## Pro Quality on a Phone Budget

The best camera is the one you have with you. Your smartphone can create professional-quality content when you know how to use it.

### Lighting with Natural Light

**The Golden Hours**
Best filming times: 1 hour after sunrise, 1 hour before sunset. Soft, warm, flattering light.

**Window Light**
- Face the window for even lighting
- 45-degree angle for dimension
- Avoid direct sunlight (too harsh)

**DIY Diffusion**
- White sheet over window = soft light
- White posterboard = bounce light into shadows
- Ring lights are affordable and effective

### Smartphone Camera Settings

**Lock Your Focus**
Tap and hold on your subject to lock focus and exposure.

**4K When Possible**
Higher resolution = more flexibility in editing. Most modern phones support 4K.

**Grid Lines On**
Use the rule of thirds for better composition.

**Clean Your Lens**
Seriously—fingerprints ruin more shots than bad lighting.

### Free Editing Apps

**CapCut** (Free)
- Professional features
- Auto-captions
- Effects and transitions

**InShot** (Free)
- Easy interface
- Good for quick edits
- Text and music

**DaVinci Resolve** (Free, Desktop)
- Hollywood-level color grading
- Professional audio tools
- Steeper learning curve but incredibly powerful

### Quick Editing Tips

1. Cut the fluff—if it doesn't add value, remove it
2. Add captions—85% of videos are watched on mute
3. Match music to mood and pacing
4. Use jump cuts to keep energy high
5. Color correct for consistency

🔥 **Action Step**: Film 30 seconds of content using only natural window light and your phone. Compare it to your previous content.`
      },
      {
        id: 6,
        title: "Sound Design That Pops",
        duration: "10 min",
        overview: "Audio is 50% of your video. Learn to select music, record clear audio, and use sound effects to enhance your content.",
        keyTakeaways: [
          "Royalty-free music sources",
          "Recording clean audio",
          "Sound effects timing"
        ],
        content: `## Audio: The Unsung Hero

Bad audio will make people scroll faster than bad video. Great audio is invisible—you don't notice it because it just *works*.

### Royalty-Free Music Sources

**Free Options:**
- **YouTube Audio Library**: Huge selection, completely free
- **Pixabay Music**: Free for commercial use
- **Uppbeat**: Free tier available

**Trending Sounds:**
- Use platform's built-in sounds for discoverability
- Trending audio = algorithm boost
- Put your own spin on popular sounds

### Recording Clean Audio

**Environment Matters**
- Small rooms with soft surfaces absorb echo
- Avoid rooms with hard floors and bare walls
- Close windows to block traffic noise

**Phone Recording Tips**
- Get close to the mic (12-18 inches)
- Record in a closet for surprisingly good sound
- Use voice memos for audio-only recording

**Affordable Upgrades**
- Lavalier mics ($20-50) plug into your phone
- USB mics for desktop content
- Windscreens for outdoor recording

### Sound Effects That Pop

**Timing is Everything**
Sound effects should hit on the beat:
- Whoosh on transitions
- Pop on text appearing
- Ding on key points

**Less is More**
- 2-3 well-placed effects > constant noise
- Match effect intensity to content energy
- Preview without sound effects to check if needed

### Audio Mixing Basics

**Volume Levels**
- Voice: Primary, loudest element
- Music: 20-30% volume under voice
- Effects: Match or slightly under music

**The Ducking Technique**
Lower music automatically when voice starts. Most editing apps have this built in.

🔥 **Action Step**: Rewatch your last 3 videos with headphones. Note where audio could be improved.`
      },
      {
        id: 7,
        title: "The Content Creation Workflow",
        duration: "15 min",
        overview: "Build a sustainable system for consistent content creation. From batch filming to editing pipelines.",
        keyTakeaways: [
          "Batch content creation",
          "Content calendars",
          "Editing efficiency tips"
        ],
        content: `## Building Your Content Machine

Consistency beats virality. The creators who win are the ones who show up regularly. That requires a sustainable system.

### Batch Content Creation

**The Power of Batching**
Film multiple videos in one session:
- Same setup, minimal context switching
- Get in the creative flow once
- More content, less effort

**The 10x Rule**
When you sit down to create, aim for 10 pieces of content:
- 3 might be great
- 5 will be good
- 2 might not work
- But you have a week's worth of content

### Content Calendars

**Planning Ahead**
- Map out themes for the month
- Align with trends and seasons
- Build series that connect

**Tools That Help**
- Notion: Free, flexible database
- Google Sheets: Simple and shareable
- Trello: Visual kanban boards

**The 3-Bucket System**
1. **Evergreen**: Content that's always relevant
2. **Trending**: Riding current waves
3. **Personal**: Your unique stories

### Editing Efficiency

**Template Everything**
- Save intro/outro templates
- Create preset effects you use often
- Build a library of transitions

**The 80/20 Rule**
80% of impact comes from 20% of edits:
- Good hook
- Clear audio
- Tight cuts
- Strong ending

Focus on these before perfecting the rest.

**Outsourcing**
When to consider help:
- You're spending more time editing than creating
- Editing is burning you out
- You can afford it ($50-200/video)

🔥 **Action Step**: Block 3 hours this week. Film 5 pieces of content in that one session. Edit them throughout the week.`
      },
      {
        id: 8,
        title: "Analyzing and Improving",
        duration: "15 min",
        overview: "Use analytics to understand what works. Learn to read metrics and iterate on your content strategy.",
        keyTakeaways: [
          "Key metrics that matter",
          "A/B testing content",
          "Continuous improvement mindset"
        ],
        content: `## Data-Driven Content Creation

Your analytics tell a story. Learn to read it and use it to improve.

### Key Metrics That Matter

**1. Retention Rate**
The most important metric. How long do people watch?
- 0-3 seconds: Hook effectiveness
- Middle: Content quality
- End: Payoff delivery

**2. Engagement Rate**
(Likes + Comments + Shares + Saves) / Views
- 5%+ is good
- 10%+ is excellent
- Saves indicate high value content

**3. Share Rate**
Shares are the holy grail:
- Each share = free distribution
- High share rate = viral potential
- Focus on "share-worthy" content

**4. Follower Conversion**
Views to Followers ratio:
- Are viewers becoming fans?
- Which content converts best?
- Build more of what converts

### A/B Testing Content

**What to Test**
- Different hooks
- Thumbnail variations
- Posting times
- Content lengths
- Call-to-actions

**How to Test**
- Change ONE variable at a time
- Post at similar times
- Compare performance after 48 hours
- Document results

**Reading Results**
- 10-20% difference = possibly random
- 30%+ difference = significant signal
- Repeat tests to confirm

### The Continuous Improvement Loop

**The Weekly Review**
Every week, answer:
1. What performed best? Why?
2. What underperformed? Why?
3. What will I try next week?

**The Monthly Audit**
1. Top 3 performing content pieces
2. Common threads between winners
3. Trends to double down on
4. What to stop doing

**Never Stop Learning**
- Study your competitors
- Stay updated on platform changes
- Experiment constantly
- Share learnings with creator friends

### Congratulations!

You've completed "Content That Connects"!

You now have the foundation to:
- Create emotionally resonant content
- Hook viewers in the first 3 seconds
- Tell compelling stories
- Produce quality on any budget
- Build sustainable systems
- Use data to improve

🔥 **Final Action Step**: Post your first piece of content using everything you've learned. Share it with our community for feedback!`
      }
    ]
  },

  102: {
    id: 102,
    title: "Building Your Brand",
    description: "Profile optimization, niche selection, and consistency strategies",
    longDescription: "Your personal brand is your most valuable asset in the creator economy. Learn to define your unique voice, optimize your profile for discovery, and build a cohesive brand identity that attracts your ideal audience.",
    totalDuration: "1.5 hours",
    level: 0,
    badge: "Brand Builder",
    prerequisites: [],
    learningOutcomes: [
      "Define your unique value proposition as a creator",
      "Optimize profiles for maximum discoverability",
      "Create a cohesive visual and verbal brand identity",
      "Develop a content strategy aligned with your brand"
    ],
    lessons: [
      {
        id: 1,
        title: "Finding Your Niche",
        duration: "15 min",
        overview: "Discover the intersection of your passions, skills, and market demand. Learn to position yourself in a niche where you can thrive.",
        keyTakeaways: [
          "The passion-skill-demand framework",
          "Niche vs micro-niche strategies",
          "Competitive analysis techniques"
        ],
        content: `## Finding Your Perfect Niche

The most successful creators don't try to appeal to everyone. They find a specific niche where they can become the go-to voice.

### The Passion-Skill-Demand Framework

Your ideal niche sits at the intersection of three circles:

**1. Passion**
What could you talk about for hours? What do you naturally research and explore? Passion fuels consistency—you'll need to create hundreds of pieces of content.

**2. Skill**
What are you genuinely good at? This could be knowledge, abilities, or unique experiences. Your skill gives you credibility.

**3. Demand**
Are people actively searching for this content? Is there an audience willing to engage? Demand ensures your efforts pay off.

### Niche vs Micro-Niche

**Broad Niche**: Fitness
**Niche**: Home workouts
**Micro-Niche**: 15-minute home workouts for busy moms

The more specific, the:
- Easier to become the expert
- More targeted your audience
- Clearer your content direction
- But smaller the potential audience

Start micro-niche, expand as you grow.

### Competitive Analysis

Before committing, research your niche:

**Who's already there?**
- Top 10 creators in your space
- Their content style and frequency
- What's working for them

**What gaps exist?**
- Underserved sub-topics
- Audiences not being reached
- Perspectives not represented

**Can you differentiate?**
- Your unique angle
- Your specific audience
- Your distinct style

### The Validation Test

Before fully committing:
1. Create 10 pieces of content in your niche
2. Post them and measure engagement
3. Notice how you feel creating them
4. Adjust based on response

Your niche can evolve, but start with focus.

🔥 **Action Step**: Fill out the passion-skill-demand framework. List 5 potential niches at their intersection.`
      },
      {
        id: 2,
        title: "Defining Your Unique Voice",
        duration: "15 min",
        overview: "Stand out by being authentically you. Develop a distinct personality and communication style that resonates.",
        keyTakeaways: [
          "Voice and tone development",
          "Authenticity in content creation",
          "Signature phrases and catchphrases"
        ],
        content: `## Your Voice is Your Superpower

In a sea of content, your unique voice is what makes you memorable. People follow personalities, not just information.

### Understanding Voice vs Tone

**Voice** = Your consistent personality
- Your humor style
- Your energy level
- Your values and beliefs
- Your vocabulary choices

**Tone** = How you adapt to context
- Celebratory for wins
- Empathetic for struggles
- Educational for tutorials
- Hype for announcements

Your voice stays consistent; your tone flexes.

### Discovering Your Natural Voice

Don't fabricate a persona—amplify who you already are:

**Record yourself talking naturally**
- Call a friend about your topic
- Notice your natural expressions
- Capture your genuine enthusiasm

**Review your texts and messages**
- How do you naturally communicate?
- What phrases do you use often?
- What's your texting style?

**Ask close friends**
- "How would you describe my personality?"
- "What do I say all the time?"
- "What makes me... me?"

### Voice Characteristics to Define

**Energy Level**: Calm and thoughtful vs. high energy and hype
**Humor Style**: Dry wit, silly, sarcastic, wholesome
**Formality**: Professional, casual, street, academic
**Emotional Range**: Reserved, expressive, vulnerable
**Perspective**: Optimistic, realistic, contrarian

### Signature Elements

Create memorable moments:

**Catchphrases**
- Greeting: "What's good, everyone!"
- Signoff: "Stay curious, stay creative"
- Reaction: "You know what? That's valid."

**Visual Signatures**
- Hand gestures
- Facial expressions
- Background elements

**Audio Signatures**
- Intro sounds
- Transition phrases
- Music choices

### Authenticity Over Perfection

What resonates:
- Real reactions
- Genuine opinions
- Honest struggles
- Imperfect moments

What doesn't:
- Trying too hard
- Copying other creators
- Hiding your personality
- Being what you think people want

🔥 **Action Step**: Record a 2-minute unscripted video talking about your topic. Watch it back and note 5 things that feel uniquely "you."`
      },
      {
        id: 3,
        title: "Visual Brand Identity",
        duration: "15 min",
        overview: "Create a recognizable visual style. From color palettes to thumbnails, build visual consistency across your content.",
        keyTakeaways: [
          "Color psychology for creators",
          "Thumbnail design principles",
          "Visual consistency across platforms"
        ],
        content: `## Creating Visual Recognition

When someone scrolls past your content, they should know it's you before reading a word. Visual branding creates instant recognition.

### Color Psychology for Creators

Colors evoke emotions. Choose intentionally:

**Red**: Energy, passion, urgency
**Orange**: Creativity, enthusiasm, warmth
**Yellow**: Optimism, clarity, happiness
**Green**: Growth, health, nature
**Blue**: Trust, calm, professionalism
**Purple**: Creativity, luxury, wisdom
**Pink**: Playful, nurturing, romantic
**Black**: Sophistication, power, elegance

### Building Your Color Palette

**Primary Color**: Your main brand color (1)
**Secondary Colors**: Complementary colors (2-3)
**Accent Color**: For highlights and CTAs (1)
**Neutral Colors**: For text and backgrounds

Tools to help:
- Coolors.co for palette generation
- Adobe Color for combinations
- Canva's color palette generator

### Thumbnail Design Principles

Thumbnails are billboards. Make them pop:

**The 3-Second Rule**
- Clear focal point
- Readable at small sizes
- Emotional expression

**What Works**:
- Faces with expressions
- Bold, contrasting colors
- Large, readable text (3-5 words max)
- Consistent frame/template

**What Doesn't**:
- Cluttered designs
- Small text
- Low contrast
- Inconsistent styles

### Visual Consistency Checklist

**Fonts**
- Headline font (bold, attention-grabbing)
- Body font (readable, clean)
- Stick to 2-3 fonts maximum

**Photo/Video Style**
- Lighting preference
- Filter/color grade
- Framing and composition

**Graphics and Overlays**
- Icon style
- Shape preferences
- Animation style

### Templates Save Time

Create templates for:
- Thumbnails
- Stories/Posts
- Quote graphics
- Announcement graphics

Use the same layouts, swap the content.

### Brand Board

Create a one-page visual reference:
- Logo variations
- Color codes (hex values)
- Font names and uses
- Photo/graphic style examples
- Do's and don'ts

🔥 **Action Step**: Create a simple brand board with your colors, fonts, and style references. Use Canva's free brand kit feature.`
      },
      {
        id: 4,
        title: "Profile Optimization",
        duration: "15 min",
        overview: "Your profile is your storefront. Optimize every element from bio to profile picture to convert visitors into followers.",
        keyTakeaways: [
          "Bio writing formulas",
          "Profile picture best practices",
          "Link-in-bio strategies"
        ],
        content: `## Your Profile is Your Storefront

Every profile visit is a potential follower. Optimize every element for conversion.

### Profile Picture Best Practices

**What Works**:
- Clear face shot (fill 60% of frame)
- Good lighting (natural or ring light)
- Eye contact with camera
- Genuine expression (smile or character)
- Brand colors in background/clothing

**What Doesn't**:
- Group photos (who are you?)
- Distant shots (can't see you)
- Heavy filters (looks inauthentic)
- Logos (unless you're a business)
- Sunglasses (eyes build connection)

### Bio Writing Formulas

You have limited characters. Make them count.

**Formula 1: What + Who + Why**
"[What you do] for [who you help] | [What they'll get]"
Example: "Crypto simplified for beginners | Learn Web3 without the jargon"

**Formula 2: Credibility + Promise**
"[Your credential] | [What you share]"
Example: "Ex-TikTok employee | Behind-the-scenes algorithm secrets"

**Formula 3: Personality + Value**
"[Fun personal fact] | [What you offer]"
Example: "Coffee addict + code nerd | Daily coding tips that actually work"

### Bio Elements to Include

**Line 1**: What you do / who you are
**Line 2**: Who you help / what value you provide
**Line 3**: Credibility or personality
**Line 4**: Call-to-action

Add relevant emojis for visual breaks (but don't overdo it).

### Link-in-Bio Strategies

One link, multiple destinations:

**Option 1: Simple Landing Page**
- Linktree, Beacons, or Stan
- List your key links
- Feature current promotions

**Option 2: Custom Page**
- Your own website
- Email capture
- Full control

**What to Link**:
- Latest content/project
- Email newsletter signup
- Other platforms
- Products/services
- Community/Discord

### Username Strategy

**Consistency**: Same handle everywhere when possible
**Memorable**: Easy to spell and say
**Searchable**: Includes your niche keyword if natural
**Professional**: Avoid numbers/underscores if possible

### Highlights/Pinned Content

First impressions matter:
- Pin your best-performing content
- Showcase different content types
- Include a "Start Here" or intro post
- Feature testimonials/results

🔥 **Action Step**: Audit your current profile against this checklist. Make 3 immediate improvements.`
      },
      {
        id: 5,
        title: "Content Pillars Strategy",
        duration: "15 min",
        overview: "Organize your content around key themes. Build content pillars that reinforce your brand and serve your audience.",
        keyTakeaways: [
          "Defining 3-5 content pillars",
          "Balancing variety and consistency",
          "Content pillar rotation strategies"
        ],
        content: `## The Content Pillars Framework

Random content confuses your audience. Content pillars give structure while maintaining variety.

### What Are Content Pillars?

Content pillars are 3-5 core themes that all your content falls under. They:
- Define what you talk about
- Set audience expectations
- Make content planning easier
- Reinforce your expertise

### Choosing Your Pillars

**Step 1: List Everything**
Write down every topic you could cover in your niche.

**Step 2: Group Themes**
Cluster similar topics into categories.

**Step 3: Select 3-5 Core Pillars**
Choose themes that:
- You can consistently create around
- Your audience cares about
- Show your unique perspective
- Support each other

### Content Pillar Examples

**Fitness Creator**:
1. Workout tutorials
2. Nutrition tips
3. Mindset/motivation
4. Personal fitness journey

**Crypto Educator**:
1. Beginner tutorials
2. Market analysis
3. Project reviews
4. Personal portfolio updates

**Business Coach**:
1. Marketing strategies
2. Mindset development
3. Client stories
4. Behind-the-scenes

### The 3 Content Types Per Pillar

For each pillar, create three types:

**Educational**: Teach something valuable
**Entertaining**: Make them smile/feel
**Personal**: Share your journey

This creates 9-15 content categories total.

### Content Pillar Rotation

**Option 1: Daily Rotation**
Monday: Pillar 1
Tuesday: Pillar 2
Wednesday: Pillar 3
Thursday: Pillar 1
Friday: Pillar 4

**Option 2: Weighted Rotation**
Focus 50% on your main pillar
Distribute 50% among others

**Option 3: Responsive Rotation**
More of what's performing well
Less of what isn't resonating

### Pillar Documentation

For each pillar, document:
- Sub-topics within the pillar
- Content ideas bank
- Best-performing examples
- Hashtags and keywords
- Visual style notes

### Evolving Your Pillars

Your pillars can change as you grow:
- Add new pillars gradually
- Retire pillars that don't resonate
- Let audience feedback guide you
- Stay true to your core brand

🔥 **Action Step**: Define your 3-5 content pillars. List 10 content ideas under each pillar.`
      },
      {
        id: 6,
        title: "Brand Consistency Across Platforms",
        duration: "15 min",
        overview: "Maintain your brand identity while adapting to different platforms. Learn platform-specific optimization techniques.",
        keyTakeaways: [
          "Platform-specific adaptations",
          "Cross-promotion strategies",
          "Maintaining core brand elements"
        ],
        content: `## One Brand, Multiple Platforms

Your brand should be recognizable everywhere while respecting each platform's unique culture.

### Core vs Flexible Elements

**Keep Consistent (Core)**:
- Your voice and personality
- Color palette
- Values and messaging
- Profile photo
- Core content themes

**Adapt (Flexible)**:
- Content format and length
- Posting frequency
- Tone and formality
- Platform-specific features
- Trending participation

### Platform-Specific Adaptations

**TikTok/Short-Form**:
- Casual, energetic
- Trend participation
- Quick hooks
- Native sounds

**YouTube**:
- More polished production
- Longer, deeper content
- SEO-optimized titles
- Thumbnail importance

**Twitter/X**:
- Concise, witty
- Conversation-focused
- Thread potential
- Real-time engagement

**Instagram**:
- Visual-first
- Aesthetic consistency
- Stories for casual
- Reels for reach

**LinkedIn**:
- Professional tone
- Industry insights
- Thought leadership
- Career-related content

### Cross-Promotion Strategies

**Repurposing Content**:
- Long video → Short clips
- Blog → Thread → Carousel
- Podcast → Audiograms
- Stats → Graphics

**Platform Funneling**:
- Tease on one platform
- Full content on another
- "Link in bio for more"
- Platform-specific incentives

**Cohesive Campaigns**:
- Same message, different formats
- Coordinated launch timing
- Platform-specific CTAs

### Maintaining Recognition

Even when adapting:
- Use consistent username
- Same profile photo
- Include brand colors
- Signature phrases
- Similar bio messaging

### The 80/20 Rule

**80% Platform-Native**:
Content that feels natural to the platform

**20% Cross-Platform**:
Repurposed or consistent brand content

### Managing Multiple Platforms

**Start with one**: Master it before expanding
**Add gradually**: One new platform at a time
**Prioritize**: Know your main platform
**Batch create**: Make content for all platforms at once
**Use tools**: Scheduling, analytics, management

### Platform Priority Matrix

Rank platforms by:
1. Where your audience is
2. What format suits your content
3. Your time investment
4. Growth potential

Don't be everywhere—be impactful somewhere.

🔥 **Action Step**: Audit your presence across platforms. Ensure profile consistency and plan one piece of repurposed content this week.`
      }
    ]
  },

  103: {
    id: 103,
    title: "Engagement Secrets",
    description: "Timing, hashtags, community building, and algorithm mastery",
    longDescription: "Engagement is the lifeblood of content success. Go beyond views to build a community that actively participates. Learn the technical and psychological strategies that turn passive viewers into active fans.",
    totalDuration: "3 hours",
    level: 1,
    badge: "Engagement Pro",
    prerequisites: ["Content That Connects"],
    learningOutcomes: [
      "Master platform algorithms and optimize for reach",
      "Build genuine community through engagement strategies",
      "Use data to optimize posting times and content types",
      "Create content that sparks conversation and shares"
    ],
    lessons: [
      {
        id: 1,
        title: "Understanding the Algorithm",
        duration: "20 min",
        overview: "Demystify how content gets distributed. Learn the key signals algorithms use to decide what content to promote.",
        keyTakeaways: [
          "Key ranking factors",
          "Watch time vs engagement",
          "The velocity effect"
        ],
        content: `## How Algorithms Actually Work

Algorithms aren't magic or conspiracy—they're systems designed to show users content they'll engage with. Understanding them gives you a massive advantage.

### The Core Purpose

Every social algorithm has one job: **keep users on the platform longer**.

Content that achieves this gets promoted. Content that doesn't gets buried.

### Key Ranking Factors

**1. Watch Time / Dwell Time**
How long do people spend with your content?
- 100% completion rate = strong signal
- Rewatches = even stronger
- Quick scrolls = negative signal

**2. Engagement Velocity**
How quickly does your content get engagement after posting?
- First 30-60 minutes are critical
- Fast likes/comments = "this is hot"
- Slow engagement = "this is cold"

**3. Engagement Quality**
Not all engagement is equal:
- Shares > Saves > Comments > Likes
- Long comments > short comments
- New followers from content = gold

**4. Completion Signals**
- Watch to end
- Click "see more"
- Tap on profile after viewing

### The Velocity Effect

The algorithm tests your content on small audiences first:
- Show to 200-500 followers
- Measure engagement rate
- If strong, expand to 1000+
- If weak, limit distribution

This is why early engagement is crucial.

### Watch Time vs Engagement

**Watch Time**: How long people watch
- Best for: story content, tutorials, entertainment
- Optimize: hooks, pacing, payoffs

**Engagement**: Actions people take
- Best for: controversial, question-based, community content
- Optimize: CTAs, conversation starters, shareable moments

The best content maximizes both.

### What Gets Suppressed

Algorithms actively limit:
- Watermarks from other platforms
- Engagement bait ("Like if you agree!")
- Low-resolution content
- Duplicate/reposted content
- Links in captions (sometimes)

🔥 **Action Step**: Check your last 10 posts. Calculate average watch time and engagement rate. Find patterns in your top performers.`
      },
      {
        id: 2,
        title: "Optimal Posting Strategy",
        duration: "15 min",
        overview: "Timing matters. Learn to analyze your audience and find the perfect posting windows for maximum reach.",
        keyTakeaways: [
          "Analyzing audience activity",
          "Time zone considerations",
          "Posting frequency optimization"
        ],
        content: `## Timing is Everything

The same content posted at different times can have wildly different results. Find your optimal windows.

### Why Timing Matters

**The Velocity Factor**
Early engagement signals quality to the algorithm. Post when your audience is active.

**The Competition Factor**
Peak times have more viewers but also more competition. Off-peak can mean less competition.

### Finding Your Audience's Schedule

**Use Platform Analytics**
- Most platforms show when followers are online
- Look for peaks and patterns
- Note day-of-week variations

**Test and Measure**
- Post similar content at different times
- Track performance by time slot
- Build your own data set

**Common Patterns**:
- Morning commute (7-9 AM)
- Lunch break (12-1 PM)
- Evening wind-down (7-10 PM)
- Late night scrolling (10 PM-12 AM)

### Time Zone Considerations

**Know Your Core Audience**
- Where are most of your followers?
- What time zone dominates?
- International considerations?

**Multi-Region Strategy**
- Primary post for main time zone
- Reshares/Stories for other regions
- Consider regional content variations

### Posting Frequency

**The Sweet Spots**:
- TikTok: 1-4 times per day
- Instagram: 1-2 times per day
- YouTube: 1-3 times per week
- Twitter/X: 3-10 times per day

**Quality Over Quantity**
- 1 great post > 5 mediocre posts
- Consistency > volume
- Don't burn out chasing frequency

### The Consistency Factor

Algorithms reward consistent posting:
- Same time slots build habits
- Followers know when to expect you
- Algorithms learn your pattern

But don't be a slave to schedule:
- Skip a post if quality isn't there
- Trend opportunities trump schedule
- Your mental health matters

### Advanced: Content-Time Matching

Different content types perform at different times:
- Educational: Weekday mornings/lunch
- Entertainment: Evenings/weekends
- Motivational: Monday mornings
- Personal: Evenings when people relax

🔥 **Action Step**: Analyze your top 10 posts. What times/days were they posted? Find your golden windows.`
      },
      {
        id: 3,
        title: "Hashtag Mastery",
        duration: "20 min",
        overview: "Use hashtags strategically, not randomly. Learn research techniques and the perfect hashtag mix for discoverability.",
        keyTakeaways: [
          "Hashtag research tools",
          "The 30/30/30/10 mix strategy",
          "Branded hashtag creation"
        ],
        content: `## Strategic Hashtag Use

Hashtags are discovery tools, not magic. Use them strategically to reach new audiences.

### How Hashtags Actually Work

**Categorization**: Hashtags tell the algorithm what your content is about
**Discovery**: Users browse hashtags to find content
**Communities**: Hashtags connect niche communities

### The 30/30/30/10 Mix Strategy

Use a balanced mix of hashtag sizes:

**30% Large (1M+ posts)**
- High competition, broad reach
- Examples: #fitness #travel #food
- Get occasional lucky breaks

**30% Medium (100K-1M posts)**
- Moderate competition
- More targeted audiences
- Better chance to rank

**30% Small (10K-100K posts)**
- Low competition
- Highly targeted
- Easier to get featured

**10% Micro (<10K posts)**
- Your niche community
- Branded hashtags
- Super targeted

### Research Tools and Techniques

**Native Search**
- Type keywords, see suggestions
- Check post counts
- Browse recent posts

**Competitor Analysis**
- What hashtags do top creators use?
- Which seem to perform well?
- Note patterns

**Tools**:
- Later.com hashtag suggestions
- Display Purposes
- All Hashtag generator

### Hashtag Research Process

1. Brainstorm 50+ relevant tags
2. Check size/competition for each
3. Group by size category
4. Test combinations
5. Track performance
6. Refine over time

### Creating Branded Hashtags

**Your Personal Tag**
- Unique to you (#YourNameCreates)
- Use on all content
- Encourage fans to use it

**Campaign Tags**
- For specific series (#30DayChallenge)
- Time-limited
- Community participation

### Platform-Specific Notes

**Instagram**: Up to 30 (use 20-25 strategic ones)
**TikTok**: 3-5 highly relevant
**Twitter/X**: 2-3 maximum
**YouTube**: Include in description, not title

### Common Mistakes

- Using banned/spammy hashtags
- Same hashtags every post (algorithmic penalty)
- Irrelevant popular hashtags
- Only using huge hashtags

🔥 **Action Step**: Research 50 hashtags in your niche. Categorize them by size. Create 5 different hashtag combinations to test.`
      },
      {
        id: 4,
        title: "Comments That Convert",
        duration: "15 min",
        overview: "Turn comments into community. Learn response strategies that build relationships and encourage more engagement.",
        keyTakeaways: [
          "Response timing and prioritization",
          "Conversation starters",
          "Handling negative comments"
        ],
        content: `## The Power of Comment Engagement

Comments are conversations. How you handle them determines whether viewers become fans.

### Why Comments Matter

**Algorithm Signals**
- Comments show engagement
- Your replies count as comments too
- Conversations boost content reach

**Community Building**
- Personal connection
- Loyalty development
- Word-of-mouth growth

### Response Timing

**The Golden Hour**
Reply to comments in the first hour:
- Shows you're active
- Encourages more comments
- Boosts algorithmic performance

**Sustainable Approach**
- Set 2-3 reply sessions per day
- 15-30 minutes each
- Prioritize quality over quantity

### Prioritization Framework

**Always Reply To**:
- Questions (especially good ones)
- Thoughtful comments
- First-time commenters
- Influential accounts

**Acknowledge With Likes**:
- Simple positive reactions
- Generic compliments
- Emoji-only comments

### Conversation Starters

**Turn Statements Into Conversations**:

Instead of: "Thanks!"
Try: "Thanks! What part resonated with you most?"

Instead of: "Glad you liked it!"
Try: "So glad! Are you dealing with this challenge too?"

**Ask Follow-Up Questions**
- "What's been your experience?"
- "Have you tried this?"
- "What would you add?"

### Handling Negative Comments

**Constructive Criticism**
- Thank them for feedback
- Consider if valid
- Explain your perspective calmly

**Trolls and Haters**
- Don't feed them
- Delete if genuinely harmful
- Block repeat offenders
- Sometimes humor works

**Controversial Topics**
- Stay calm and professional
- Clarify if misunderstood
- Know when to disengage

### Creating Commentable Content

Design your content to spark comments:
- Ask questions in your content
- Leave things debatable
- Request opinions
- Create "tag a friend who..." moments

### Pinned Comments Strategy

Pin comments that:
- Add value to the content
- Ask questions you want answered
- Feature community members
- Drive to CTAs

🔥 **Action Step**: Spend 30 minutes replying to your most recent comments using conversation-starting techniques.`
      },
      {
        id: 5,
        title: "Creating Shareable Content",
        duration: "20 min",
        overview: "Design content that people want to share. Understand the psychology of sharing and create for it.",
        keyTakeaways: [
          "Share triggers",
          "Meme-able moments",
          "Collaborative content ideas"
        ],
        content: `## The Science of Sharing

Shares are the ultimate engagement. When someone shares your content, they're vouching for you to their audience.

### Why People Share

**Social Currency**
"This makes me look good"
- Insider knowledge
- Being first to share
- Showing good taste

**Identity Expression**
"This is who I am"
- Values alignment
- Group belonging
- Self-expression

**Utility**
"This helps others"
- Practical tips
- Important information
- Saving for later

**Emotion**
"I need to process this"
- Strong reactions
- Relatable moments
- Emotional release

### Creating Share Triggers

**The "So True" Effect**
Content that makes people think "finally someone said it"
- Relatable struggles
- Unpopular opinions
- Shared experiences

**The "This Is Useful" Effect**
Content people want to reference later
- Tips and tutorials
- Lists and frameworks
- Resources and tools

**The "You Need To See This" Effect**
Content too good not to share
- Incredible skill
- Shocking revelation
- Peak humor

### Meme-able Moments

Create content that's easy to remix:
- Reaction-worthy moments
- Quotable lines
- Recognizable formats
- Templates people can use

**Encourage Remixes**
- Duet-friendly content
- Stitch opportunities
- Challenge formats

### Collaborative Content

Content that involves your audience:
- User-submitted content
- Community challenges
- Collaborative projects
- Crowd-sourced ideas

**The Tag Dynamic**
Create content people want to tag friends in:
- "Tag someone who needs this"
- Couple content, friend content
- Specific scenarios

### Format Optimization for Shares

**Easy to Consume**
- Clear and quick value
- Skimmable format
- Strong visual hook

**Easy to Share**
- Standalone context (no need to explain)
- Not too long
- Clear value proposition

### Testing Shareability

Before posting, ask:
- Would I share this?
- Who would share this?
- Why would they share it?
- What would they say when sharing?

🔥 **Action Step**: Analyze your most-shared content. Identify the share trigger in each. Plan 3 new pieces designed for shareability.`
      },
      {
        id: 6,
        title: "Building Community Rituals",
        duration: "15 min",
        overview: "Create recurring elements that your community looks forward to. Build traditions that strengthen bonds.",
        keyTakeaways: [
          "Weekly series concepts",
          "Community challenges",
          "Inside jokes and references"
        ],
        content: `## Rituals Create Loyalty

Communities are built on shared experiences. Create rituals that your audience anticipates and participates in.

### Why Rituals Work

**Anticipation**: People look forward to recurring elements
**Belonging**: Participating creates group identity
**Habit**: Regular rituals become part of their routine
**Memory**: Rituals create shared memories

### Types of Community Rituals

**Weekly Series**
- Same topic every week
- Dedicated day and time
- Clear naming (#MondayMotivation)

**Community Challenges**
- Time-limited activities
- Shared hashtag
- Progress sharing

**Interactive Formats**
- Q&A sessions
- AMAs
- Community polls

**Celebrations**
- Milestone acknowledgments
- Member spotlights
- Achievement celebrations

### Creating a Weekly Series

**Pick Your Day**
Choose a day that works:
- Aligned with your schedule
- When audience is active
- Not oversaturated by others

**Name It Memorably**
- Alliteration works (#TuesdayTips)
- Clear purpose
- Easy to remember

**Commit and Execute**
- At least 8-12 weeks minimum
- Same format each time
- Build anticipation

### Community Challenges

**Structure**:
- Clear rules and timeline
- Easy entry point
- Shareable participation
- Recognition for participants

**Examples**:
- 30-day challenges
- Weekly submissions
- Creative prompts
- Skill-building journeys

### Inside Jokes and References

**How They Form**:
- Memorable moments from past content
- Running gags
- Community-created terms
- Callback references

**Why They Matter**:
- Create in-group feeling
- Reward loyal followers
- Make community distinctive

**How to Cultivate**:
- Reference past moments
- Embrace organic jokes
- Let community name things
- Create recurring characters/themes

### Spotlight Rituals

Regularly featuring community members:
- Comment of the week
- Fan art features
- Transformation spotlights
- Question features

This encourages participation and shows you value the community.

### Documenting Rituals

Keep track of:
- What rituals you've established
- Their performance metrics
- Community response
- Evolution over time

🔥 **Action Step**: Design one weekly ritual for your community. Plan the first 4 weeks of content for it.`
      },
      {
        id: 7,
        title: "Collaborations and Duets",
        duration: "20 min",
        overview: "Leverage other creators to grow. Learn collaboration etiquette and strategies that benefit everyone.",
        keyTakeaways: [
          "Finding collaboration partners",
          "Pitch templates that work",
          "Win-win collaboration structures"
        ],
        content: `## Growing Through Collaboration

Collaborations expose you to new audiences. Done right, everyone wins. Done wrong, you burn bridges.

### Why Collaborations Work

**Audience Sharing**: Both creators' audiences see the content
**Credibility Transfer**: Association with respected creators
**Content Variety**: Fresh perspectives for your audience
**Relationship Building**: Network expansion

### Finding the Right Partners

**Ideal Collaboration Criteria**:
- Similar audience size (within 2-3x)
- Complementary content (not identical)
- Aligned values and tone
- Mutual benefit potential

**Where to Find Partners**:
- Your comment section (active engagers)
- Niche community spaces
- Creator networking events
- Direct outreach

### The Collaboration Pitch

**What to Include**:
1. Genuine appreciation of their work
2. Who you are (brief)
3. The idea (specific)
4. Why it benefits them
5. Easy next step

**Example Pitch**:
"Hey [Name]! Been loving your content on [specific topic]. I'm [brief intro]. I have an idea for a collab that I think our audiences would love: [specific idea]. I think this works because [mutual benefit]. Would you be open to a quick chat?"

### Collaboration Formats

**For Video Platforms**:
- Duets/Stitches (easiest)
- Split-screen challenges
- Takeovers
- Joint live streams
- Series collaborations

**For All Platforms**:
- Guest posts
- Interviews
- Joint challenges
- Cross-promotions

### Win-Win Structures

**Equal Value Exchange**:
- Similar promotion effort
- Comparable production contribution
- Fair credit and exposure

**Clear Agreements**:
- What each person does
- When/where it posts
- How to credit each other
- Cross-promotion expectations

### Collaboration Etiquette

**Do**:
- Be professional and reliable
- Communicate clearly
- Promote as agreed
- Give proper credit
- Follow through on commitments

**Don't**:
- Ghost or flake
- Over-promise and under-deliver
- Steal ideas or content
- Make it all about you
- Forget to promote their version

### After the Collaboration

- Thank them publicly and privately
- Share performance results
- Discuss future opportunities
- Maintain the relationship

🔥 **Action Step**: Identify 5 potential collaboration partners. Draft a personalized pitch for each.`
      },
      {
        id: 8,
        title: "Trend Surfing",
        duration: "15 min",
        overview: "Ride trends while maintaining authenticity. Learn to spot trends early and adapt them to your brand.",
        keyTakeaways: [
          "Trend discovery sources",
          "Speed vs quality balance",
          "Brand-aligned trend adaptation"
        ],
        content: `## Riding the Wave

Trends offer massive reach potential. The key is participating authentically and quickly.

### Why Trends Matter

**Algorithmic Boost**: Platforms push trending content
**Discovery**: New audiences searching for trends
**Relevance**: Shows you're current and engaged
**Community**: Shared cultural moments

### Trend Discovery Sources

**On Platform**:
- Discover/Explore pages
- Trending sounds
- Popular hashtags
- For You/Recommended

**Off Platform**:
- Twitter for breaking trends
- Reddit for emerging topics
- Google Trends for search trends
- Pop culture news

**Community Sources**:
- What are other creators in your niche doing?
- What's your audience sharing?
- Trend tracking accounts

### Speed vs Quality Balance

**The Trend Lifecycle**:
1. Emerging (best time to join)
2. Growing (still good)
3. Peak (saturated)
4. Declining (too late)

**Speed Matters** because:
- Early adopters get more reach
- Less competition initially
- More likely to be featured

**Quality Still Matters** because:
- Bad execution hurts your brand
- Low-quality trend content is noise
- Your reputation > trend reach

### Brand-Aligned Adaptation

**The Niche Twist**
Don't just copy—adapt to your brand:
- Use trending sound, your topic
- Trending format, your expertise
- Trending challenge, your take

**What Makes a Good Trend Fit**:
- Aligns with your values
- Makes sense for your audience
- You can add unique perspective
- Doesn't feel forced

**When to Skip a Trend**:
- Conflicts with your brand
- You can't do it well
- It's already dying
- It doesn't resonate with your audience

### Trend Participation Framework

1. **Spot**: Find the trend early
2. **Evaluate**: Does it fit your brand?
3. **Adapt**: How can you make it yours?
4. **Create**: Produce quickly but well
5. **Post**: Timing is crucial
6. **Engage**: Ride the wave of engagement

### Creating Your Own Trends

Advanced strategy:
- Create unique formats
- Start community challenges
- Develop signature sounds/phrases
- Inspire remixes

🔥 **Action Step**: Find 3 current trends. Practice adapting each to your niche. Post the strongest one today.`
      },
      {
        id: 9,
        title: "Analytics Deep Dive",
        duration: "20 min",
        overview: "Move beyond surface metrics. Learn to extract actionable insights from your analytics.",
        keyTakeaways: [
          "Advanced metric analysis",
          "Cohort analysis",
          "Predictive patterns"
        ],
        content: `## Beyond Vanity Metrics

Views and likes feel good, but deeper metrics tell you what's actually working and why.

### The Metrics Hierarchy

**Vanity Metrics** (feel good, less actionable):
- Total views
- Total followers
- Like counts

**Engagement Metrics** (better):
- Engagement rate
- Save rate
- Share rate
- Comment quality

**Business Metrics** (best):
- Follower conversion
- Link clicks
- Revenue per view

### Advanced Metric Analysis

**Retention Curves**
Where do people drop off?
- Sharp early drop = weak hook
- Gradual middle drop = pacing issues
- End drop = weak payoff

**Engagement Distribution**
- Which content types get shares vs saves vs comments?
- What correlates with follower growth?

**Traffic Sources**
- Where are views coming from?
- Hashtags, sounds, For You, shares?
- Double down on working sources

### Cohort Analysis

Compare performance across groups:

**By Time**:
- How does content from this month compare to last?
- Are you improving?

**By Type**:
- Tutorials vs entertainment vs personal
- Which type drives what goal?

**By Topic**:
- Which content pillars perform best?
- What should you do more/less of?

### Finding Predictive Patterns

**Identify Leading Indicators**:
- Early metrics that predict final performance
- Example: 30-minute engagement predicts 24-hour performance

**Build Your Playbook**:
- When X happens, do Y
- When content hits Z threshold in 1 hour, boost it
- When performance is low, adjust strategy

### The Weekly Review Process

Every week, answer:
1. What were my top 3 performing pieces?
2. What do they have in common?
3. What were my bottom 3?
4. What can I learn?
5. What will I do differently next week?

### Monthly Deep Dives

Monthly, analyze:
- Overall growth trends
- Engagement rate changes
- Content mix performance
- Audience demographics shifts
- Revenue and conversion data

### Tools for Analysis

- Native platform analytics
- Spreadsheet tracking
- Third-party tools (Later, Hootsuite)
- Custom dashboards

### Actionable Insights

Turn data into action:
- "Videos under 30 seconds get 2x engagement" → Make shorter content
- "Posts at 7 PM get more shares" → Shift posting time
- "Tutorial content drives follows" → Create more tutorials

🔥 **Action Step**: Export your last 30 days of analytics. Create a simple spreadsheet tracking your key metrics. Find one actionable insight.`
      },
      {
        id: 10,
        title: "Engagement Automation",
        duration: "20 min",
        overview: "Scale your engagement without losing authenticity. Tools and techniques for managing growing communities.",
        keyTakeaways: [
          "Engagement scheduling",
          "Community management tools",
          "Delegation strategies"
        ],
        content: `## Scaling Your Presence

As you grow, personal engagement becomes a time challenge. Scale smartly without losing authenticity.

### The Scaling Challenge

**The Paradox**:
- Engagement grows your audience
- Larger audience = more engagement needed
- Eventually, you can't reply to everyone

**The Goal**:
Maintain the feeling of personal connection while serving more people efficiently.

### What to Automate (and What Not To)

**Safe to Automate**:
- Post scheduling
- Analytics collection
- Content cross-posting
- DM auto-responses for FAQs

**Never Automate**:
- Personal replies (use real words)
- Relationship building
- Genuine conversations
- Community crisis response

### Engagement Scheduling

**Batched Engagement Sessions**:
- Set specific times for engagement
- 3x per day for 15-30 minutes
- Focus > scattered attention

**The Reply Stack**:
- Morning: Reply to overnight comments
- Midday: Engage with others' content
- Evening: Reply to day's comments

### Community Management Tools

**For Organization**:
- Comment tagging/filtering
- DM categorization
- Saved replies for common questions

**For Analytics**:
- Engagement tracking
- Response time monitoring
- Sentiment analysis

**Popular Tools**:
- Creator Studio (Meta)
- TubeBuddy (YouTube)
- Social management platforms

### Building a Moderation Team

When to get help:
- Comments exceed personal capacity
- Hateful/spam comments increase
- You're spending too much time on moderation

**Moderator Responsibilities**:
- Filter inappropriate comments
- Flag important comments for you
- Answer routine questions
- Enforce community guidelines

### Saved Responses (Done Right)

**Templates Are Starting Points**:
- Save common response frameworks
- Personalize before sending
- Add specific details each time

**Example**:
Template: "Thanks so much for sharing your experience! [Personalization]. Keep up the great work!"
Used: "Thanks so much for sharing your experience! Sounds like you've really made progress with the morning routine. Keep up the great work!"

### Delegation Strategies

**What to Delegate First**:
- Moderation
- Analytics reporting
- Content scheduling
- Research and trend spotting

**What to Keep Personal**:
- Content creation
- Key relationship responses
- Strategic decisions
- Community vision

### Maintaining Authenticity at Scale

- Regular "real" interactions
- Personal stories in content
- Acknowledgment of growth
- Transparency about team

### Congratulations!

You've completed "Engagement Secrets"!

You now understand:
- How algorithms really work
- Optimal timing and hashtag strategies
- How to build genuine community
- Collaboration and trend tactics
- Data-driven optimization
- Scaling without losing authenticity

🔥 **Final Action Step**: Implement one new engagement strategy from each lesson this week. Track the impact.`
      }
    ]
  },

  104: {
    id: 104,
    title: "Going Live",
    description: "Streaming tips, audience interaction, and live monetization",
    longDescription: "Live streaming creates unmatched connection with your audience. Master the art of going live, from technical setup to real-time audience engagement, and learn how to monetize your live presence effectively.",
    totalDuration: "2 hours",
    level: 1,
    badge: "Live Expert",
    prerequisites: ["Building Your Brand"],
    learningOutcomes: [
      "Set up professional-quality live streams on any budget",
      "Engage audiences in real-time with confidence",
      "Handle technical issues and challenging situations live",
      "Monetize live content through multiple revenue streams"
    ],
    lessons: [
      {
        id: 1,
        title: "Live Streaming Setup",
        duration: "20 min",
        overview: "Get your technical setup right. From lighting to audio to streaming software, build a professional stream.",
        keyTakeaways: [
          "Essential equipment checklist",
          "Streaming software options",
          "Optimal settings and bitrates"
        ]
      },
      {
        id: 2,
        title: "Pre-Stream Preparation",
        duration: "15 min",
        overview: "Preparation prevents panic. Create checklists and routines that ensure smooth broadcasts every time.",
        keyTakeaways: [
          "Pre-stream checklist template",
          "Content planning for lives",
          "Energy and mindset preparation"
        ]
      },
      {
        id: 3,
        title: "Real-Time Engagement",
        duration: "20 min",
        overview: "Keep viewers engaged and entertained. Master the skills of reading chat, shoutouts, and interactive elements.",
        keyTakeaways: [
          "Chat reading techniques",
          "Shoutout strategies",
          "Interactive games and polls"
        ]
      },
      {
        id: 4,
        title: "Handling Live Challenges",
        duration: "15 min",
        overview: "Things go wrong. Learn to handle technical issues, trolls, and awkward moments with grace.",
        keyTakeaways: [
          "Technical troubleshooting live",
          "Moderator management",
          "Recovering from mistakes"
        ]
      },
      {
        id: 5,
        title: "Building a Stream Schedule",
        duration: "15 min",
        overview: "Consistency builds audiences. Create a streaming schedule that works for you and your viewers.",
        keyTakeaways: [
          "Finding your time slots",
          "Promoting upcoming streams",
          "Handling schedule changes"
        ]
      },
      {
        id: 6,
        title: "Live Monetization Strategies",
        duration: "20 min",
        overview: "Turn live viewers into revenue. From tips to sponsorships, learn multiple ways to monetize your streams.",
        keyTakeaways: [
          "Tip incentives and goals",
          "Sponsor integration in lives",
          "Exclusive live content"
        ]
      },
      {
        id: 7,
        title: "Repurposing Live Content",
        duration: "15 min",
        overview: "Get more mileage from your streams. Turn live content into clips, highlights, and evergreen content.",
        keyTakeaways: [
          "Clip creation strategies",
          "Highlight editing",
          "Cross-platform distribution"
        ]
      }
    ]
  },

  // ============================================
  // WEB3 MASTERY TRACK
  // ============================================
  201: {
    id: 201,
    title: "Crypto 101",
    description: "Wallets, transactions, gas fees, and blockchain basics explained simply",
    longDescription: "Enter the world of cryptocurrency with confidence. This comprehensive introduction covers everything you need to know about blockchain technology, from how it works to how to safely manage your digital assets.",
    totalDuration: "4 hours",
    level: 0,
    badge: "Crypto Novice",
    prerequisites: [],
    learningOutcomes: [
      "Understand how blockchain technology works",
      "Set up and secure a cryptocurrency wallet",
      "Make transactions safely and understand gas fees",
      "Recognize and avoid common crypto scams"
    ],
    lessons: [
      {
        id: 1,
        title: "What is Blockchain?",
        duration: "20 min",
        overview: "Understand the revolutionary technology behind crypto. Learn how decentralized ledgers work in simple terms.",
        keyTakeaways: [
          "Decentralization explained",
          "Blocks and chains",
          "Consensus mechanisms basics"
        ]
      },
      {
        id: 2,
        title: "Cryptocurrencies Explained",
        duration: "20 min",
        overview: "From Bitcoin to altcoins, understand different types of cryptocurrencies and their purposes.",
        keyTakeaways: [
          "Bitcoin vs Ethereum vs altcoins",
          "Tokens vs coins",
          "Use cases for different cryptos"
        ]
      },
      {
        id: 3,
        title: "Setting Up Your First Wallet",
        duration: "25 min",
        overview: "Step-by-step guide to creating your crypto wallet. Choose between hot and cold wallets.",
        keyTakeaways: [
          "MetaMask installation",
          "Seed phrase security",
          "Hot vs cold wallet decision"
        ]
      },
      {
        id: 4,
        title: "Wallet Security Essentials",
        duration: "20 min",
        overview: "Protect your assets. Learn the security practices that keep your crypto safe from hackers.",
        keyTakeaways: [
          "Never share your seed phrase",
          "Recognizing phishing attempts",
          "Hardware wallet benefits"
        ]
      },
      {
        id: 5,
        title: "Understanding Gas Fees",
        duration: "20 min",
        overview: "Gas fees can be confusing. Learn what they are, why they exist, and how to optimize them.",
        keyTakeaways: [
          "What gas actually is",
          "Gas price vs gas limit",
          "Layer 2 solutions for lower fees"
        ]
      },
      {
        id: 6,
        title: "Making Your First Transaction",
        duration: "25 min",
        overview: "Send and receive crypto safely. Practice transactions and understand confirmation times.",
        keyTakeaways: [
          "Sending transactions step-by-step",
          "Confirmation times",
          "Transaction troubleshooting"
        ]
      },
      {
        id: 7,
        title: "Reading the Blockchain",
        duration: "15 min",
        overview: "Use block explorers to track transactions and verify information on the blockchain.",
        keyTakeaways: [
          "Using Etherscan/Arbiscan",
          "Understanding transaction details",
          "Verifying contract addresses"
        ]
      },
      {
        id: 8,
        title: "Networks and Bridges",
        duration: "20 min",
        overview: "Navigate between different blockchain networks. Understand mainnet, testnet, and bridges.",
        keyTakeaways: [
          "Adding networks to wallet",
          "Bridge basics",
          "Network switching"
        ]
      },
      {
        id: 9,
        title: "Common Scams and How to Avoid Them",
        duration: "25 min",
        overview: "Crypto has bad actors. Learn to recognize and avoid the most common scams targeting newcomers.",
        keyTakeaways: [
          "Phishing site recognition",
          "Too-good-to-be-true offers",
          "Safe practices checklist"
        ]
      },
      {
        id: 10,
        title: "Buying Crypto Safely",
        duration: "20 min",
        overview: "From exchanges to on-ramps, learn the safest ways to acquire your first cryptocurrency.",
        keyTakeaways: [
          "Centralized vs decentralized exchanges",
          "KYC requirements",
          "Fiat on-ramp options"
        ]
      },
      {
        id: 11,
        title: "Arbitrum and Layer 2",
        duration: "20 min",
        overview: "Understand Layer 2 scaling solutions and why Lumina uses Arbitrum for fast, cheap transactions.",
        keyTakeaways: [
          "What is Layer 2",
          "Arbitrum advantages",
          "Bridging to Arbitrum"
        ]
      },
      {
        id: 12,
        title: "Your Crypto Journey Begins",
        duration: "10 min",
        overview: "Recap and next steps. Set yourself up for continued learning and safe exploration.",
        keyTakeaways: [
          "Key principles to remember",
          "Resources for continued learning",
          "Community support options"
        ]
      }
    ]
  },

  202: {
    id: 202,
    title: "Your First NFT",
    description: "Creating, minting, and selling digital art on the blockchain",
    longDescription: "NFTs have revolutionized digital ownership. Learn the complete process of creating, minting, and selling your first NFT, whether you're an artist, musician, or content creator.",
    totalDuration: "2.5 hours",
    level: 1,
    badge: "NFT Creator",
    prerequisites: ["Crypto 101"],
    learningOutcomes: [
      "Understand what NFTs are and their value proposition",
      "Create and mint your first NFT",
      "List and sell NFTs on marketplaces",
      "Build an NFT collection strategy"
    ],
    lessons: [
      {
        id: 1,
        title: "NFTs Demystified",
        duration: "20 min",
        overview: "Cut through the hype. Understand what NFTs really are and why they matter for creators.",
        keyTakeaways: [
          "Digital ownership explained",
          "NFT use cases beyond art",
          "The creator economy angle"
        ]
      },
      {
        id: 2,
        title: "Preparing Your Digital Asset",
        duration: "20 min",
        overview: "Get your artwork ready for the blockchain. File formats, sizes, and optimization.",
        keyTakeaways: [
          "Supported file formats",
          "Resolution and size guidelines",
          "Metadata preparation"
        ]
      },
      {
        id: 3,
        title: "Choosing Your Marketplace",
        duration: "15 min",
        overview: "Different marketplaces serve different needs. Learn which platform fits your goals.",
        keyTakeaways: [
          "Marketplace comparison",
          "Fee structures",
          "Audience considerations"
        ]
      },
      {
        id: 4,
        title: "Minting Your First NFT",
        duration: "25 min",
        overview: "Step-by-step minting process. From connecting your wallet to completing your first mint.",
        keyTakeaways: [
          "Minting walkthrough",
          "Gas fee management",
          "Lazy minting options"
        ]
      },
      {
        id: 5,
        title: "Pricing Strategies",
        duration: "15 min",
        overview: "How much is your NFT worth? Learn pricing strategies that balance value and sales.",
        keyTakeaways: [
          "Fixed price vs auction",
          "Research-based pricing",
          "Edition sizes"
        ]
      },
      {
        id: 6,
        title: "Marketing Your NFTs",
        duration: "20 min",
        overview: "NFTs don't sell themselves. Learn promotion strategies that attract collectors.",
        keyTakeaways: [
          "Building collector relationships",
          "Social media promotion",
          "Community engagement"
        ]
      },
      {
        id: 7,
        title: "Royalties and Ongoing Revenue",
        duration: "15 min",
        overview: "Set up royalties for passive income. Understand secondary sales and their potential.",
        keyTakeaways: [
          "Royalty percentages",
          "Marketplace royalty support",
          "Long-term revenue planning"
        ]
      },
      {
        id: 8,
        title: "Building a Collection",
        duration: "20 min",
        overview: "Think beyond single pieces. Plan and launch a cohesive NFT collection.",
        keyTakeaways: [
          "Collection themes",
          "Release strategies",
          "Roadmap planning"
        ]
      }
    ]
  },

  203: {
    id: 203,
    title: "Understanding DeFi",
    description: "Staking, liquidity provision, yield farming, and DEX fundamentals",
    longDescription: "Decentralized Finance (DeFi) offers financial opportunities without traditional intermediaries. Master the concepts and safely participate in staking, liquidity provision, and yield strategies.",
    totalDuration: "3.5 hours",
    level: 2,
    badge: "DeFi Expert",
    prerequisites: ["Crypto 101"],
    learningOutcomes: [
      "Navigate decentralized exchanges confidently",
      "Understand and participate in staking",
      "Provide liquidity and understand impermanent loss",
      "Evaluate DeFi opportunities and risks"
    ],
    lessons: [
      {
        id: 1,
        title: "DeFi Fundamentals",
        duration: "20 min",
        overview: "What makes finance 'decentralized'? Understand the philosophy and mechanics of DeFi.",
        keyTakeaways: [
          "Traditional vs decentralized finance",
          "Smart contracts in finance",
          "Key DeFi principles"
        ]
      },
      {
        id: 2,
        title: "Decentralized Exchanges (DEXs)",
        duration: "25 min",
        overview: "Trade without intermediaries. Learn to use DEXs like a pro.",
        keyTakeaways: [
          "AMM mechanics",
          "Swapping tokens",
          "Slippage and price impact"
        ]
      },
      {
        id: 3,
        title: "Understanding Staking",
        duration: "20 min",
        overview: "Earn rewards by locking your tokens. Learn staking mechanics and strategies.",
        keyTakeaways: [
          "How staking works",
          "APY calculations",
          "Lock periods and risks"
        ]
      },
      {
        id: 4,
        title: "Staking AXM on Lumina",
        duration: "20 min",
        overview: "Practical guide to staking AXM tokens. Step-by-step through the Lumina staking interface.",
        keyTakeaways: [
          "Staking walkthrough",
          "Reward claiming",
          "Unstaking process"
        ]
      },
      {
        id: 5,
        title: "Liquidity Provision Basics",
        duration: "25 min",
        overview: "Become a liquidity provider. Understand how LPs work and earn trading fees.",
        keyTakeaways: [
          "Liquidity pools explained",
          "Adding/removing liquidity",
          "LP tokens"
        ]
      },
      {
        id: 6,
        title: "Impermanent Loss Explained",
        duration: "20 min",
        overview: "The main risk of LP. Understand impermanent loss and strategies to mitigate it.",
        keyTakeaways: [
          "How IL happens",
          "Calculating IL",
          "IL mitigation strategies"
        ]
      },
      {
        id: 7,
        title: "Yield Farming Strategies",
        duration: "25 min",
        overview: "Maximize your returns. Learn yield farming strategies from conservative to aggressive.",
        keyTakeaways: [
          "Farming vs staking",
          "Compounding strategies",
          "Risk-adjusted returns"
        ]
      },
      {
        id: 8,
        title: "DeFi Risk Assessment",
        duration: "20 min",
        overview: "Not all protocols are safe. Learn to evaluate DeFi projects before depositing.",
        keyTakeaways: [
          "Audit importance",
          "TVL and liquidity depth",
          "Team and track record"
        ]
      },
      {
        id: 9,
        title: "DeFi Security Practices",
        duration: "20 min",
        overview: "Protect yourself in DeFi. Security practices specific to decentralized finance.",
        keyTakeaways: [
          "Approval management",
          "Revoking permissions",
          "Transaction simulation"
        ]
      },
      {
        id: 10,
        title: "Building Your DeFi Portfolio",
        duration: "15 min",
        overview: "Putting it all together. Create a balanced DeFi strategy aligned with your goals.",
        keyTakeaways: [
          "Diversification principles",
          "Rebalancing strategies",
          "Tracking tools"
        ]
      }
    ]
  },

  204: {
    id: 204,
    title: "DAO Participation",
    description: "How to vote, create proposals, and govern decentralized organizations",
    longDescription: "DAOs represent a new form of organization. Learn to actively participate in decentralized governance, from voting on proposals to creating your own and understanding the dynamics of collective decision-making.",
    totalDuration: "2 hours",
    level: 1,
    badge: "DAO Citizen",
    prerequisites: ["Crypto 101"],
    learningOutcomes: [
      "Understand DAO structures and governance models",
      "Participate effectively in DAO voting",
      "Create and champion proposals",
      "Navigate DAO politics and community dynamics"
    ],
    lessons: [
      {
        id: 1,
        title: "What is a DAO?",
        duration: "20 min",
        overview: "Decentralized Autonomous Organizations explained. Understand this new organizational paradigm.",
        keyTakeaways: [
          "DAO definition and types",
          "Smart contract governance",
          "Token-based voting"
        ]
      },
      {
        id: 2,
        title: "Governance Token Mechanics",
        duration: "15 min",
        overview: "Understand how tokens translate to voting power and influence in DAOs.",
        keyTakeaways: [
          "Voting power calculation",
          "Delegation options",
          "Token distribution models"
        ]
      },
      {
        id: 3,
        title: "Reading and Evaluating Proposals",
        duration: "20 min",
        overview: "Not all proposals deserve your vote. Learn to analyze proposals critically.",
        keyTakeaways: [
          "Proposal anatomy",
          "Impact assessment",
          "Hidden implications"
        ]
      },
      {
        id: 4,
        title: "Casting Your Vote",
        duration: "15 min",
        overview: "Step-by-step guide to voting in DAO governance. From connecting wallet to confirming votes.",
        keyTakeaways: [
          "Voting interface walkthrough",
          "Gas-free voting options",
          "Vote delegation"
        ]
      },
      {
        id: 5,
        title: "Creating Proposals",
        duration: "20 min",
        overview: "Have an idea? Learn to create proposals that gain support and pass.",
        keyTakeaways: [
          "Proposal writing best practices",
          "Building support before submission",
          "Responding to feedback"
        ]
      },
      {
        id: 6,
        title: "DAO Community Dynamics",
        duration: "15 min",
        overview: "DAOs are communities. Navigate the social dynamics of decentralized organizations.",
        keyTakeaways: [
          "Building reputation",
          "Finding allies",
          "Constructive disagreement"
        ]
      }
    ]
  },

  // ============================================
  // MONETIZATION & GROWTH TRACK
  // ============================================
  301: {
    id: 301,
    title: "Earning AXM",
    description: "All the ways to earn tokens on Lumina through content and engagement",
    longDescription: "Lumina rewards creators and participants with AXM tokens. Discover all the ways to earn on the platform, from content creation to engagement activities, and maximize your token earnings.",
    totalDuration: "2 hours",
    level: 0,
    badge: "Token Earner",
    prerequisites: [],
    learningOutcomes: [
      "Understand all AXM earning opportunities on Lumina",
      "Optimize your activities for maximum rewards",
      "Track and manage your earnings effectively",
      "Plan a sustainable earning strategy"
    ],
    lessons: [
      {
        id: 1,
        title: "The Lumina Rewards System",
        duration: "15 min",
        overview: "How Lumina distributes rewards. Understand the tokenomics behind your earnings.",
        keyTakeaways: [
          "Reward pool mechanics",
          "Distribution schedules",
          "Earning multipliers"
        ]
      },
      {
        id: 2,
        title: "Content Creation Rewards",
        duration: "20 min",
        overview: "Earn by creating. Learn how content performance translates to AXM rewards.",
        keyTakeaways: [
          "Quality scoring factors",
          "Engagement bonuses",
          "Consistency rewards"
        ]
      },
      {
        id: 3,
        title: "Engagement Rewards",
        duration: "15 min",
        overview: "Active participation pays. Earn through likes, comments, and community engagement.",
        keyTakeaways: [
          "Engagement point system",
          "Daily earning limits",
          "Quality vs quantity"
        ]
      },
      {
        id: 4,
        title: "Daily Check-ins and Streaks",
        duration: "15 min",
        overview: "Consistency is rewarded. Maximize earnings through daily activities and streaks.",
        keyTakeaways: [
          "Check-in bonuses",
          "Streak multipliers",
          "Recovery strategies"
        ]
      },
      {
        id: 5,
        title: "Quest and Achievement Rewards",
        duration: "15 min",
        overview: "Complete quests for bonus earnings. Track and optimize your achievement hunting.",
        keyTakeaways: [
          "Quest types and rewards",
          "Achievement badges",
          "Strategic quest completion"
        ]
      },
      {
        id: 6,
        title: "Level-Based Earning Bonuses",
        duration: "15 min",
        overview: "Higher levels mean higher earnings. Understand how XP translates to earning power.",
        keyTakeaways: [
          "Level bonus percentages",
          "XP optimization",
          "Long-term progression"
        ]
      },
      {
        id: 7,
        title: "Claiming and Managing Rewards",
        duration: "15 min",
        overview: "Get your earnings into your wallet. Learn the claiming process and gas optimization.",
        keyTakeaways: [
          "Claim process walkthrough",
          "Gas cost considerations",
          "Optimal claim timing"
        ]
      },
      {
        id: 8,
        title: "Building a Sustainable Strategy",
        duration: "10 min",
        overview: "Avoid burnout while maximizing earnings. Create a balanced earning strategy.",
        keyTakeaways: [
          "Time vs reward optimization",
          "Activity balance",
          "Long-term sustainability"
        ]
      }
    ]
  },

  302: {
    id: 302,
    title: "Tipping Economy",
    description: "How to receive and give tips effectively, building supporter relationships",
    longDescription: "Tips are direct support from your community. Learn to cultivate a tipping culture around your content, build relationships with supporters, and create content that inspires generosity.",
    totalDuration: "1.5 hours",
    level: 0,
    badge: "Tip Master",
    prerequisites: [],
    learningOutcomes: [
      "Create content that inspires tips",
      "Build genuine relationships with tippers",
      "Set up and manage tip receiving",
      "Develop a culture of reciprocal support"
    ],
    lessons: [
      {
        id: 1,
        title: "The Psychology of Tipping",
        duration: "15 min",
        overview: "Why do people tip? Understand the motivations that drive supporters to give.",
        keyTakeaways: [
          "Tipping motivations",
          "Emotional triggers",
          "Value exchange mindset"
        ]
      },
      {
        id: 2,
        title: "Setting Up Tip Receiving",
        duration: "15 min",
        overview: "Technical setup for receiving tips. Configure your wallet and profile for tips.",
        keyTakeaways: [
          "Wallet configuration",
          "Profile tip settings",
          "Payment visibility"
        ]
      },
      {
        id: 3,
        title: "Content That Inspires Support",
        duration: "20 min",
        overview: "Create content people want to support. Learn what makes viewers reach for their wallets.",
        keyTakeaways: [
          "Value-first content",
          "Vulnerability and authenticity",
          "Call-to-action placement"
        ]
      },
      {
        id: 4,
        title: "Building Supporter Relationships",
        duration: "20 min",
        overview: "Tips are relationships. Nurture your supporters and turn one-time tippers into regulars.",
        keyTakeaways: [
          "Thank you best practices",
          "Exclusive recognition",
          "Community building with supporters"
        ]
      },
      {
        id: 5,
        title: "Strategic Tipping as a Creator",
        duration: "15 min",
        overview: "Give to receive. How strategic tipping to others builds your own community.",
        keyTakeaways: [
          "Reciprocity dynamics",
          "Networking through tips",
          "Budget allocation"
        ]
      }
    ]
  },

  303: {
    id: 303,
    title: "Building Paid Communities",
    description: "Premium content strategies, subscriptions, and exclusive access",
    longDescription: "Transform followers into paying members. Learn to create premium content tiers, exclusive communities, and subscription models that provide real value to your most dedicated fans.",
    totalDuration: "3 hours",
    level: 2,
    badge: "Community Leader",
    prerequisites: ["Engagement Secrets", "Earning AXM"],
    learningOutcomes: [
      "Design compelling premium content offerings",
      "Price and structure subscription tiers",
      "Deliver ongoing value to paying members",
      "Scale community management effectively"
    ],
    lessons: [
      {
        id: 1,
        title: "The Premium Community Model",
        duration: "20 min",
        overview: "Why paid communities work. Understand the business model and value proposition.",
        keyTakeaways: [
          "Free vs paid content balance",
          "Community value proposition",
          "Sustainable creator income"
        ]
      },
      {
        id: 2,
        title: "Designing Your Offer",
        duration: "25 min",
        overview: "What will members pay for? Create an irresistible premium offer.",
        keyTakeaways: [
          "Exclusive content ideas",
          "Access and community benefits",
          "Unique experiences"
        ]
      },
      {
        id: 3,
        title: "Tier Structure and Pricing",
        duration: "20 min",
        overview: "Multiple tiers serve different fans. Learn to structure and price your offerings.",
        keyTakeaways: [
          "Tier design principles",
          "Pricing psychology",
          "Upgrade paths"
        ]
      },
      {
        id: 4,
        title: "Launching Your Paid Community",
        duration: "20 min",
        overview: "Launch with impact. Strategies for a successful paid community launch.",
        keyTakeaways: [
          "Pre-launch buildup",
          "Founding member incentives",
          "Launch day execution"
        ]
      },
      {
        id: 5,
        title: "Delivering Consistent Value",
        duration: "20 min",
        overview: "Retention requires ongoing value. Create systems for consistent member satisfaction.",
        keyTakeaways: [
          "Content calendars for members",
          "Surprise and delight moments",
          "Feedback loops"
        ]
      },
      {
        id: 6,
        title: "Managing Member Expectations",
        duration: "15 min",
        overview: "Clear expectations prevent churn. Set and manage what members expect from you.",
        keyTakeaways: [
          "Onboarding processes",
          "Communication standards",
          "Handling disappointment"
        ]
      },
      {
        id: 7,
        title: "Community Moderation at Scale",
        duration: "20 min",
        overview: "As communities grow, moderation matters more. Systems for healthy paid communities.",
        keyTakeaways: [
          "Rules and guidelines",
          "Moderator recruitment",
          "Conflict resolution"
        ]
      },
      {
        id: 8,
        title: "Reducing Churn",
        duration: "15 min",
        overview: "Keep members longer. Strategies to reduce cancellations and increase lifetime value.",
        keyTakeaways: [
          "Churn warning signs",
          "Re-engagement campaigns",
          "Exit interviews"
        ]
      },
      {
        id: 9,
        title: "Scaling Your Community",
        duration: "20 min",
        overview: "Grow without losing quality. Scale your paid community sustainably.",
        keyTakeaways: [
          "Automation opportunities",
          "Team building",
          "Maintaining intimacy at scale"
        ]
      },
      {
        id: 10,
        title: "Advanced Monetization",
        duration: "15 min",
        overview: "Beyond subscriptions. Additional revenue streams within your community.",
        keyTakeaways: [
          "One-time purchases",
          "Live events and workshops",
          "Merchandise and products"
        ]
      }
    ]
  },

  304: {
    id: 304,
    title: "Referral Mastery",
    description: "Growing your network for rewards and building viral loops",
    longDescription: "Turn your network into a growth engine. Master referral strategies that reward you while genuinely helping others discover the platform.",
    totalDuration: "2 hours",
    level: 1,
    badge: "Growth Hacker",
    prerequisites: ["Building Your Brand"],
    learningOutcomes: [
      "Understand referral program mechanics and rewards",
      "Create authentic referral content",
      "Build viral loops that compound growth",
      "Track and optimize referral performance"
    ],
    lessons: [
      {
        id: 1,
        title: "Referral Program Fundamentals",
        duration: "15 min",
        overview: "How the Lumina referral program works. Understand the rewards and mechanics.",
        keyTakeaways: [
          "Reward structure",
          "Tracking and attribution",
          "Tier bonuses"
        ]
      },
      {
        id: 2,
        title: "Finding Your Referral Audience",
        duration: "20 min",
        overview: "Who should you refer? Identify and reach people who will thrive on the platform.",
        keyTakeaways: [
          "Ideal referral profiles",
          "Where to find them",
          "Qualification strategies"
        ]
      },
      {
        id: 3,
        title: "Authentic Referral Messaging",
        duration: "20 min",
        overview: "Avoid being spammy. Create referral content that's genuinely helpful.",
        keyTakeaways: [
          "Value-first messaging",
          "Storytelling approaches",
          "Avoiding common pitfalls"
        ]
      },
      {
        id: 4,
        title: "Referral Content Strategies",
        duration: "20 min",
        overview: "Create content that naturally drives referrals. Integrate referrals into your content strategy.",
        keyTakeaways: [
          "Tutorial content",
          "Success story sharing",
          "Platform showcase videos"
        ]
      },
      {
        id: 5,
        title: "Building Viral Loops",
        duration: "20 min",
        overview: "Create systems where referrals generate more referrals. Compound your growth.",
        keyTakeaways: [
          "Network effect design",
          "Incentive alignment",
          "Gamification elements"
        ]
      },
      {
        id: 6,
        title: "Tracking and Optimizing",
        duration: "15 min",
        overview: "Measure what works. Use data to improve your referral strategy.",
        keyTakeaways: [
          "Key metrics to track",
          "A/B testing approaches",
          "Continuous improvement"
        ]
      }
    ]
  },

  // ============================================
  // COMMUNITY & ADVOCACY TRACK
  // ============================================
  401: {
    id: 401,
    title: "Leading Groups",
    description: "How to create, grow, and moderate thriving communities",
    longDescription: "Great communities don't happen by accident. Learn the skills to create, nurture, and lead groups that bring people together around shared interests and values.",
    totalDuration: "2.5 hours",
    level: 1,
    badge: "Group Leader",
    prerequisites: ["Engagement Secrets"],
    learningOutcomes: [
      "Create groups with clear purpose and identity",
      "Grow membership organically",
      "Moderate effectively and fairly",
      "Build a self-sustaining community culture"
    ],
    lessons: [
      {
        id: 1,
        title: "The Purpose-Driven Group",
        duration: "20 min",
        overview: "Start with why. Define a compelling purpose that attracts and retains members.",
        keyTakeaways: [
          "Purpose statement crafting",
          "Niche vs broad focus",
          "Differentiating your group"
        ]
      },
      {
        id: 2,
        title: "Setting Up for Success",
        duration: "15 min",
        overview: "First impressions matter. Set up your group to welcome and onboard new members effectively.",
        keyTakeaways: [
          "Group settings optimization",
          "Welcome message creation",
          "Initial content seeding"
        ]
      },
      {
        id: 3,
        title: "Establishing Group Culture",
        duration: "20 min",
        overview: "Culture is what happens when you're not looking. Deliberately build the culture you want.",
        keyTakeaways: [
          "Cultural values definition",
          "Modeling behavior",
          "Ritual and tradition creation"
        ]
      },
      {
        id: 4,
        title: "Growing Your Membership",
        duration: "20 min",
        overview: "Quality over quantity. Grow your group with the right members.",
        keyTakeaways: [
          "Promotion strategies",
          "Member vetting",
          "Referral encouragement"
        ]
      },
      {
        id: 5,
        title: "Driving Engagement",
        duration: "20 min",
        overview: "Active groups thrive. Create content and activities that keep members engaged.",
        keyTakeaways: [
          "Discussion prompts",
          "Regular events",
          "Member spotlights"
        ]
      },
      {
        id: 6,
        title: "Moderation Best Practices",
        duration: "20 min",
        overview: "Fair, consistent moderation builds trust. Learn to moderate effectively.",
        keyTakeaways: [
          "Rules and enforcement",
          "Warning systems",
          "Ban decisions"
        ]
      },
      {
        id: 7,
        title: "Building a Mod Team",
        duration: "15 min",
        overview: "You can't do it alone. Build and manage a moderation team.",
        keyTakeaways: [
          "Mod recruitment",
          "Training and guidelines",
          "Mod communication"
        ]
      },
      {
        id: 8,
        title: "Sustaining Long-Term Growth",
        duration: "20 min",
        overview: "Keep the momentum going. Strategies for long-term community health.",
        keyTakeaways: [
          "Preventing stagnation",
          "Evolving with members",
          "Leadership succession"
        ]
      }
    ]
  },

  402: {
    id: 402,
    title: "Positive Impact",
    description: "Creating content for social good and meaningful change",
    longDescription: "Use your platform for good. Learn to create content that raises awareness, drives action, and creates meaningful positive change in the world.",
    totalDuration: "2 hours",
    level: 0,
    badge: "Change Maker",
    prerequisites: [],
    learningOutcomes: [
      "Identify causes aligned with your values and audience",
      "Create compelling advocacy content",
      "Mobilize your community for action",
      "Measure and communicate impact"
    ],
    lessons: [
      {
        id: 1,
        title: "Finding Your Cause",
        duration: "20 min",
        overview: "Authenticity matters. Find causes that genuinely resonate with you and your audience.",
        keyTakeaways: [
          "Values alignment",
          "Audience interest mapping",
          "Cause research"
        ]
      },
      {
        id: 2,
        title: "Advocacy Content Creation",
        duration: "25 min",
        overview: "Move hearts and minds. Create content that educates and inspires action.",
        keyTakeaways: [
          "Storytelling for impact",
          "Facts and emotion balance",
          "Call to action design"
        ]
      },
      {
        id: 3,
        title: "Partnering with Organizations",
        duration: "15 min",
        overview: "Amplify impact through partnerships. Work with nonprofits and social enterprises.",
        keyTakeaways: [
          "Finding partners",
          "Collaboration structures",
          "Maintaining authenticity"
        ]
      },
      {
        id: 4,
        title: "Fundraising Through Content",
        duration: "20 min",
        overview: "Turn views into donations. Create fundraising campaigns that succeed.",
        keyTakeaways: [
          "Campaign design",
          "Goal setting",
          "Transparency and trust"
        ]
      },
      {
        id: 5,
        title: "Handling Sensitive Topics",
        duration: "20 min",
        overview: "Some topics require extra care. Navigate sensitive issues responsibly.",
        keyTakeaways: [
          "Trigger warnings and sensitivity",
          "Fact-checking importance",
          "Avoiding harm"
        ]
      },
      {
        id: 6,
        title: "Measuring and Sharing Impact",
        duration: "20 min",
        overview: "Show the difference you've made. Track and communicate your impact.",
        keyTakeaways: [
          "Impact metrics",
          "Reporting to supporters",
          "Celebrating wins"
        ]
      }
    ]
  },

  403: {
    id: 403,
    title: "Volunteer Training",
    description: "Become a platform ambassador and help others succeed",
    longDescription: "Give back to the community that supports you. Learn to become a platform ambassador who welcomes newcomers, answers questions, and helps others succeed.",
    totalDuration: "1.5 hours",
    level: 0,
    badge: "Ambassador",
    prerequisites: [],
    learningOutcomes: [
      "Understand the ambassador role and responsibilities",
      "Help newcomers navigate the platform",
      "Answer common questions effectively",
      "Represent the community positively"
    ],
    lessons: [
      {
        id: 1,
        title: "The Ambassador Role",
        duration: "15 min",
        overview: "What ambassadors do and why it matters. Understand your role in the community.",
        keyTakeaways: [
          "Ambassador responsibilities",
          "Impact of good ambassadors",
          "Recognition and rewards"
        ]
      },
      {
        id: 2,
        title: "Welcoming Newcomers",
        duration: "20 min",
        overview: "First impressions count. Learn to welcome new members warmly and helpfully.",
        keyTakeaways: [
          "Welcome message templates",
          "Orientation guidance",
          "Common new user struggles"
        ]
      },
      {
        id: 3,
        title: "Answering Questions",
        duration: "20 min",
        overview: "Be a helpful resource. Learn to answer questions accurately and kindly.",
        keyTakeaways: [
          "Common questions database",
          "When to escalate",
          "Teaching vs telling"
        ]
      },
      {
        id: 4,
        title: "De-escalation Skills",
        duration: "20 min",
        overview: "Handle difficult situations gracefully. Learn de-escalation techniques.",
        keyTakeaways: [
          "Staying calm",
          "Empathetic responses",
          "When to step back"
        ]
      },
      {
        id: 5,
        title: "Representing the Community",
        duration: "15 min",
        overview: "You're a face of the community. Represent it positively while being authentic.",
        keyTakeaways: [
          "Brand alignment",
          "Constructive feedback",
          "Public vs private communication"
        ]
      }
    ]
  },

  404: {
    id: 404,
    title: "Safety & Guidelines",
    description: "Understanding content moderation and community standards",
    longDescription: "A safe platform benefits everyone. Understand the community guidelines, learn to recognize violations, and contribute to a positive, safe environment for all users.",
    totalDuration: "1 hour",
    level: 0,
    badge: "Safety Champion",
    prerequisites: [],
    learningOutcomes: [
      "Understand community guidelines thoroughly",
      "Recognize guideline violations",
      "Report issues appropriately",
      "Model safe behavior for others"
    ],
    lessons: [
      {
        id: 1,
        title: "Community Guidelines Overview",
        duration: "15 min",
        overview: "Know the rules. Comprehensive overview of Lumina's community guidelines.",
        keyTakeaways: [
          "Core guidelines",
          "Prohibited content types",
          "Consequence tiers"
        ]
      },
      {
        id: 2,
        title: "Recognizing Violations",
        duration: "15 min",
        overview: "See something, say something. Learn to identify content that violates guidelines.",
        keyTakeaways: [
          "Common violation types",
          "Gray area navigation",
          "Context consideration"
        ]
      },
      {
        id: 3,
        title: "Reporting Effectively",
        duration: "15 min",
        overview: "Reports that help. Learn to submit reports that enable effective moderation.",
        keyTakeaways: [
          "Reporting process",
          "Providing context",
          "Follow-up expectations"
        ]
      },
      {
        id: 4,
        title: "Being a Safety Role Model",
        duration: "15 min",
        overview: "Lead by example. Model safe, positive behavior that others can follow.",
        keyTakeaways: [
          "Positive content creation",
          "Constructive interactions",
          "Supporting others"
        ]
      }
    ]
  }
};

export const COURSE_CATEGORIES_DETAIL: CourseCategory[] = [
  {
    id: 'creator',
    name: 'Creator Foundations',
    icon: Video,
    color: 'from-pink-500/20 to-rose-500/10',
    iconColor: 'text-pink-500',
    description: 'Master content creation and grow your audience',
    courses: [101, 102, 103, 104]
  },
  {
    id: 'web3',
    name: 'Web3 Mastery',
    icon: Wallet,
    color: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-500',
    description: 'Understand blockchain, crypto, and decentralized tech',
    courses: [201, 202, 203, 204]
  },
  {
    id: 'monetization',
    name: 'Monetization & Growth',
    icon: Coins,
    color: 'from-amber-500/20 to-yellow-500/10',
    iconColor: 'text-amber-500',
    description: 'Turn your passion into sustainable income',
    courses: [301, 302, 303, 304]
  },
  {
    id: 'community',
    name: 'Community & Advocacy',
    icon: Heart,
    color: 'from-emerald-500/20 to-green-500/10',
    iconColor: 'text-emerald-500',
    description: 'Lead and inspire positive change',
    courses: [401, 402, 403, 404]
  }
];

export function getCourseById(id: number): CourseContent | undefined {
  return COURSE_CONTENT[id];
}

export function getCoursesByCategory(categoryId: string): CourseContent[] {
  const category = COURSE_CATEGORIES_DETAIL.find(c => c.id === categoryId);
  if (!category) return [];
  return category.courses.map(id => COURSE_CONTENT[id]).filter(Boolean);
}

export function getCategoryForCourse(courseId: number): CourseCategory | undefined {
  return COURSE_CATEGORIES_DETAIL.find(cat => cat.courses.includes(courseId));
}
