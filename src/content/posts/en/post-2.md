---
title: "ESP32 and AI-Powered Personalized Calendar with E-ink Display"
pubDate: 2024-10-14
updatedDate: 2024-10-14
description: ""
author: "Dax"
tags: ["esp32", "elink", "ai"]
---

> - This is an ESP32-based e-ink AI calendar. Like time itself - yesterday cannot be kept, today is fresh, and tomorrow remains unknown - it displays unique AI-generated content each day that cannot be saved or modified, running silently with ultra-low power consumption and no power switch.
> - https://github.com/daolanx/eink-ai-calendar

<div style="display: flex; flex-direction: row; gap: 10px;">

  <div >

![ai-calendar-front](/images/posts/2/ai-calendar-front.jpg)

</div>

<div>

![ai-calendar-back](/images/posts/2/ai-calendar-back.jpg)

</div>

</div >

![ai-calendar-screenshots](/images/posts/2/ai-calendar-screenshots.png)

![ai-calendar-components](/images/posts/2/ai-calendar-componets.jpg)

# Origin

It all started when I came across LiangGao's article ["I Created an Electronic Calendar in the Digital Age to Frame Oil Paintings and Photos"](https://niu.sspai.com/post/82704). I was amazed by the results and wanted something similar to remind myself of time's unique nature - how it can't be retrieved or predicted, yet is so easily forgotten.

Initially, I wanted an electronic calendar that could display photos from my online albums, preferably randomly pulling from my NAS storage. However, after searching through shopping apps, I found that most products either stored photos locally (I later understood why) or had only black and white or tri-color displays. The available options were either pure photo frames or calendars cramped with information. The product I envisioned simply didn't exist in the market.

So I decided to build it myself. Through the comments section of the article mentioned above, I found [Ymriri's](https://github.com/Ymriri) implementation of [esp32_7color](https://github.com/Ymriri/esp32_7color). I really admired their enthusiasm and hands-on ability to transform a front-end and back-end separated e-commerce management platform into a photo management system. However, the code was quite messy. The project documentation even acknowledged this with a note saying "I know what you want to say, the folder structure is too messy, I know, but I'm too lazy to fix it, you can fix it yourself." After several attempts to understand the code, I gave up.

Finally, I found [Debatrix's](https://github.com/Debatrix) [eink-calendar](https://github.com/Debatrix/eink-calendar). Their code was the simplest, and with Cursor + GPT as programming companions, I dared to tackle unfamiliar Python and C code, learning and modifying as I went along.

# From NAS Photo Calendar to AI Image-Text Calendar

Initially, I tried to find Synology APIs to read photo data, but this proved complicated. While working on it, I had an inspiration - AI-generated images combined with daily information would better capture the essence of a calendar. So I started looking for AI text-to-image APIs.

I first tried [Cloudflare's workers-ai](https://developers.cloudflare.com/workers-ai/). While it worked, the network calls were too slow. Thinking domestic APIs might be faster, I switched to Alibaba Cloud's AI SDK, which indeed improved performance.

# Why Client-Server Architecture

Looking at LiangGao and Debatrix's code, both used client-server architecture. During development, it becomes clear that C/S architecture is more complicated - server deployment is a challenge. I suspect this is why many commercial photo frames use local storage. From a maintenance cost and privacy perspective, local storage makes more sense, and manufacturers likely made this product decision early on.

I initially thought about processing everything on the ESP32 - fetching original images, handling color dithering and data processing. However, this proved impractical, likely due to computing power and storage limitations. With limited resources on this topic, I stuck with the C/S architecture.

For server deployment, I first considered serverless computing as it seemed ideal for this use case. I tried [Cloudflare Workers](https://developers.cloudflare.com/workers/), but it didn't support necessary Python libraries like `PIL`. I looked into Alibaba Cloud's lightweight ECS and serverless options but was deterred by documentation and pricing. Considered using a Raspberry Pi, but didn't want another device to power. Finally, since I had a Synology NAS supporting Docker at home, deploying Docker images there proved secure and convenient.

# Cleaner UI

Since LiangGao replaced todo information with quotes, the UI needed modification. Looking at similar open-source calendars, many seemed cluttered with information, perhaps due to programmers' tendency to maximize data density. Shopping apps didn't offer many good calendar layouts either - some looked nice but had scattered information. Without finding a better layout, I focused on reducing information and grouping related items for simplicity. Some developers would redesign in Figma, but I haven't learned that yet.

# Streamlined Functionality

[Debatrix's](https://github.com/Debatrix) [eink-calendar](https://github.com/Debatrix/eink-calendar) includes many features like image storage, hash checking, switch control, and LED control. I initially wanted to add refresh control, but lacking circuit design experience and wanting to avoid complicating the exterior design, I removed switches and LEDs.

For daily refresh implementation, while an RTC clock module could work, it would add complexity. I discovered that besides wake-up mechanisms, WiFi connection provides time information. So I implemented hourly wake-ups - when WiFi connects and it's midnight, the display updates, achieving daily refresh without depending on RTC or server timing.

# Enhanced Aesthetics

I started with LiangGao's 3D-printed model but struggled to remove ESP32 pins with a soldering iron. Plastic or building block cases didn't match my vision, so I bought a wooden frame. The original backplate was too thick, so I purchased a thinner one. Using calipers to measure internal dimensions helped find perfectly fitting batteries and chips.

Connecting the backplate to the frame was another challenge. Initially considered a diary-style latch but couldn't find a suitable one and didn't want a protruding clasp. Magnetic attachment seemed promising, but strong magnets risked unsticking. I designed and 3D printed magnet boxes to reduce magnetic force and increase adhesion area.

Current magnetic force is slightly weak - ideally, the back cover should have magnets with magnet boxes on the frame for optimal strength.

Though inexperienced with 3D modeling, I learned through GPT guidance - creating rectangles and using boolean difference operations to make masks and magnet boxes.

# Development Insights

Honestly, this period was an exploration during technical uncertainty. Previously, I felt resistant to and unfamiliar with technology. Inspired by talks from pioneers like [Apple's Wozniak](https://www.youtube.com/watch?v=MKXjjpZqZwU) and [Linux's Torvalds](https://www.youtube.com/watch?v=o8NPllzkFhE), I realized technology is meant for play and creating value, not just for exams and work. Their achievements weren't from hard work alone - Wozniak grew up playing with math and circuits during Silicon Valley's rise, while Torvalds created Linux for fun and Git for Linux maintenance. I regret not experiencing Silicon Valley's rapid development era and misunderstanding technology through university and work experiences.

Returning to basic technical understanding, here's what I learned:

### 1. Maintain Courage and Curiosity

Previously, I was reluctant to tackle unfamiliar tech stacks. With Cursor and GPT, I could better understand code and try new things. While AI may impact programmers, it also creates opportunities. Though unfamiliar with ESP32 and Python, AI assistance helped me debug and modify, accessing interesting projects. However, AI still has limitations and lacks comprehensive understanding. As a programming assistant, it's like a prep cook to a chef or an EVA pilot to a mech - working together enhances potential.

Facing difficulties reminds me of playing Black Myth: Wukong - seemingly impossible bosses become manageable with practice and the right mindset. Courage to try matters more than methods.

As [J.K. Rowling](https://www.youtube.com/watch?v=wHGqp8lz36c) said, you'll only avoid failure by living so cautiously that you might as well not have lived at all - that's the ultimate failure.

### 2. Investigation Leads to Knowledge

Technology is a means, not an end. Learning through application is most effective. Discovering problems and goals while integrating resources and methods to solve them provides better learning than just studying for answers. This process develops both learning methods and problem-solving mindset.

Though initially unfamiliar with Python, ESP32, and e-ink displays, I found similarities in web processing, basic program logic, and endpoint handling. This demonstrates the interconnected nature of computer science fundamentals.

Many problems have multiple solutions - there's rarely one correct answer. Choices depend on current judgment and trade-offs.

### 3. Completion Over Perfection

Many say this, but experience brings understanding. I often felt urged to refactor - using Python's Flask or even Node.js - but reason prevailed. Pursuing perfection could prevent completion. Focus on goals, complete functionality, maintain restraint and clarity.

### 4. Joy in Sharing

Wozniak said technology is about doing good things and sharing. I hope I've achieved that here.

# Acknowledgments

Thanks to open source for connecting us with helpful people and interesting projects;
Thanks to AI for making unfamiliar technology more accessible.
