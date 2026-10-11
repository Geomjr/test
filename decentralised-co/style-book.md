# The Decentralised.co Style Book

*A working guide to how Decentralised.co (DCo) writes, explains, structures and designs its research. It is reverse-engineered from the publication itself.*

---

## 0. About this book

**What it is.** This is a practical style guide for anyone writing "in the DCo way": voice, how ideas are explained, how a piece is put together, house mechanics, and visual design. Each rule is backed by real examples from the archive.

**How it was built.**
- The publication's sitemap lists **274 posts** (2020–2026). All of them are indexed in [`catalogue.md`](./catalogue.md).
- **18 pieces** were read closely. They span every era, every main author and every format. Each is marked ✓ in the catalogue and listed in Appendix A.
- **Visual design** was analysed from the logo, the About page, 6 recent covers and 12 in-article charts and diagrams.
- **Metadata** (titles, subtitles, bylines, word counts, cover palettes) came from the archive pages and Substack's archive API.

**Limits.**
- Long pieces were read only up to about 30,000 characters, so endings were observed on roughly half the sample.
- Podcast show notes were seen only in archive listings; the episode pages themselves were not read.
- Where the archive is inconsistent (it often is on mechanics), this book **picks one rule and says so**, rather than copying the inconsistency.

**Quotations.** Short quotes are used as illustrations of style. All rights in the quoted material belong to Decentralised.co and its authors.

---

## 1. Who we are and who we write for

### 1.1 The publication in one breath
> "Research on all things Web3. For builders. By builders." (masthead)

DCo calls itself a holding company of operators that happens to publish. The team are not a media brand. Its stated KPI is "the depth of our writing & the actions they inspire". The About page says: "We do not want to go viral, as much as we want to be understood, debated & collaborated with."

### 1.2 The reader
- **The primary reader** is "the solo, bootstrapped founder, wondering how to take his venture from 0 to 1", plus the investors and executives who might back them. Write so that a curious, ambitious, time-poor builder can act on what they read.
- **The secondary reader** is senior people at large firms. The About page cites "Senior executives from 140+ enterprises", and the logo wall lists Coinbase, Sequoia, the WSJ, BCG and AWS. Never talk down to them, and never assume insider jargon either.
- **Vantage point:** "We write from the perspective of participants from emerging markets (India)." Examples from India, the Gulf, Africa and LatAm are a feature, not a detour.
- **Implied promise:** "We do not shill tokens… And take pride in the dull job of writing till our heads hurt."

### 1.3 Editorial principles

| Principle | What it means on the page |
|---|---|
| **Depth over eyeballs** | Long, researched pieces that don't fit in a tweet. "We rather ship a well-cooked, full-course meal to that founder's inbox." |
| **Write what we'd read ourselves** | No content for the sake of content. "No notifications without us putting in the effort to justify a person spending time consuming our content." |
| **Operators, not pundits** | Write from the seat of someone who builds, invests and owns outcomes. Prefer "what this means for builders" to "what we think about the market". |
| **Conversations, distilled** | "Our writings are usually a distilled version of conversations between a founder, researcher and VC." Show the reasoning, credit the people. |
| **Radical disclosure** | Positions, sponsorships, portfolio links and corrections go up front, in plain words. |
| **Have fun** | Humour, asides and personality are allowed. Breaking trust is not. |

---

## 2. Voice and tone

### 2.1 The voice in five adjectives
**Conversational, rigorous, wry, historically minded, candid.**

DCo sounds like a smart friend who works in venture, has read a lot of history, and is explaining something over coffee with a laptop full of charts open.

### 2.2 Person and stance
- **"I" for reasoning and experience.**
  - "I used the product for a few weeks over the course of writing this story."
  - "But there were flaws in my thinking."
- **"We" for DCo as an institution or investor.**
  - "Over the past month, we built a position in Drift."
  - "We are comfortable going long on the team itself."
- **"You" for the reader, especially in hypotheticals.**
  - "When you hit the 'Pay to Read' button…"
  - "If you are an importer in Nigeria…"
- **Multi-author pieces may be written in one first person. Say so.**
  - "Joel has written this article in first-person for ease of reading… this article was a team effort."

### 2.3 Tone dials

| Dial | Setting | Example |
|---|---|---|
| Formality | Low-to-mid. Contractions are fine and finance vocabulary is welcome. | "Don't get me wrong…", "take rates", "float", "adverse selection" |
| Humour | Dry, short, usually in parentheses or captions, after the serious point. | "No marketing managers were harmed in the writing of the article." |
| Conviction | High on theses, explicit on caveats. | "Verifiable infrastructure is a market necessity, not an option." |
| Slang | Sparing, crypto-native, never the main register. | "shill", "bag", "flex", "lmk", "Vibes" |
| Self-awareness | High: admit confusion, admit bias, admit error. | "if you feel bits of the article are confusing - it's not you, it's us" |

### 2.4 The signature move: the aphorism
Close a paragraph or section with a short, quotable line that compresses the argument. Aim for one per section, not one per paragraph.

- "Control the rails, control the economy."
- "People paid more to think less."
- "If you have a fantastic product with no liquidity, you don't have a product."
- "Survival is the ultimate flex in a market where all your peers die."
- "The TAM does not expand with better casinos."
- "Machine abundance makes human effort a luxury good."
- "Look past the agents. The real asset is the postal system."
- "History is a cruel poet with a passion for rhyming."

**Do** make it follow from evidence you've just shown.
**Don't** use it to replace evidence, or stack three in a row.

### 2.5 Humour guide
- **Self-deprecation is fine:** "Please excuse the vomiting of numbers in the paragraph above, but the point stands…"
- **Use the joke caption** when a meme or image is used: "LimeWire opened our eyes to free music.. and malware."
- **Parenthetical asides work well:** "(I am resisting the urge to plug our referral programme here.)" and "(There are too many VC darlings in the graveyard of startups.)"
- **Topical sign-offs are allowed:** "Watching ads on Prime," / "Learning how to make iced V60 coffee,"
- **Never** mock readers, founders who failed in good faith, or retail losses. The archive adds a footnote when critique could read as a takedown: "Axie Infinity is mentioned here because they are pioneers…"

---

## 3. Explanation craft: how DCo describes and explains

This is the core of the house style. DCo's distinctive skill is taking a technical or financial mechanism (MEV, RFQs, chain abstraction, x402, points, perp liquidity) and making a smart non-specialist **understand it, feel why it matters, and see the money**. The patterns below come up again and again across authors and years.

### 3.1 The explanation ladder
Almost every concept is introduced by climbing the same ladder. You can skip rungs, but don't reorder them.

1. **Problem or stakes first.** Why should the reader care? ("But why does client diversity even matter?")
2. **Plain-language definition.** One or two sentences, often flagged ("In simple terms,", "Think of a client as…").
3. **Everyday analogy.** Map it onto something the reader already knows (email servers, booking flights and hotels, marriage vs dating).
4. **Concrete walk-through.** A named person or a specific transaction with real numbers (Martin's NFT; a $200 Berlin→Singapore payment; a $100k liquidation).
5. **Visual.** A diagram or chart that shows the same walk-through.
6. **Scale or proof.** Real data that shows it happens in the wild ("Someone tried to swap $8.6 million worth of SOL for $WIF…").
7. **So what.** The implication for builders, investors or markets, usually closed with an aphorism.

**Worked example from the archive (Solana, on client diversity):**
- **Define:** "Think of a client as a piece of software that allows a computer to function as a blockchain node, the blockchain equivalent of setting up a server to receive emails on a machine."
- **Ask:** "But why does client diversity even matter? Think of it like this."
- **Reason:** "If over 66% of the network uses a single node client and the node issues a faulty update… it affects the functioning of the blockchain."
- **Show:** a chart of client share (Source line).
- **Benchmark:** "The optimal figure for individual clients is around 33%. So, there is still work to be done."

**Second example (The Data Must Flow, on how LLMs work):**
- **Scope the simplification and point to deeper sources:** "Note that this is a simplified overview. You can find more thorough explanations in this excellent article by…"
- **Define:** "LLMs use a statistical technique called next-token prediction. In simple terms, given a series of tokens (i.e., words), the model tries to predict the next most likely token."
- **Coin a handle:** "you can think of a large language model as a 'completion machine.'"
- **Announce the example:** "Let's understand this with an example."
- **Concrete case:** "the sun rises from the East", then a question: why not "the West", "the North" or "Amsterdam"?
- **Resolve:** it is all statistical patterns from massive, high-quality data.
- **Second framing:** "Another way to think of an LLM is as a compressed version of the internet."
- **Tie back to the thesis:** this is why data quantity and quality matter, which brings us to Grass.

**The definition comes late on purpose.** In the essays, the formal definition usually arrives *after* the reader has felt the need for it. Pricing the Internet runs thesis → who uses the web now → pricing history → why micropayments failed → a framework → why crypto, why now. Only then does it say "x402 is a payment standard that works with HTTP, using the decades-old 402 status code…". *What's the point?* gets to "Points are essentially off-chain IOUs…" only after the ICO cycle and the SAFT incentive gap. Only investment memos define terms up front, in a glossary block.

**The micro-template** for any paragraph that explains something:
> Claim in one sentence → "For context / For scale," + number → "In other words," + intuitive conversion → analogy ("It's like…") → the so-what as a one-line paragraph.

Example (Hyper Liquid): "With the stablecoin supply of just $1.8 billion, Solana settled $11.5 trillion worth of stablecoins. In other words, each stablecoin exchanged hands more than 6300 times… When friction disappears, velocity becomes everything."

### 3.2 Open with the problem, not the product
DCo never opens a product explanation with the product. First it builds the pain, then the product arrives as the answer.

- **Abstracting Chains** spends a whole section on fragmentation and Martin's 28 clicks before chain abstraction appears. The pivot is a run of rhetorical questions: "Aren't blockchains connected? Don't bridges solve fragmentation?… That should be a good thing, right? Well, not quite."
- **The Data Must Flow** explains why websites block data-centre IPs before introducing Grass: "That is where a residential proxy provider comes in."
- **Hyper Liquid** costs out an Ethereum liquidation ($500–3,000 of inefficiency) before showing the precompile alternative.
- **Hand-off phrases:** "This brings us to X." / "Enter Jito." / "That is where X comes in." / "This is where Drift's liquidity model becomes interesting."
- **Or open by correcting a misconception:** "Tokenisation by itself only changes how an asset is represented. It does not automatically make the asset useful as collateral." (SemiLiquid, in *Dollars Are a Technology*)
- **Or by sizing the prize** when the reader already accepts the problem: "Global cross-border flows exceeded $190 trillion… The average cost of sending $200 across borders is still 6.5%." (Stripe)
- **Reposition the company in one line:** "Keyrails comes in less as a lender and more as a payments-and-credit orchestration layer." The pattern "X is less A and more B" is a reliable way to say what something *really* is.

### 3.3 Analogy and metaphor bank
Analogy is DCo's main explanatory tool. Three families recur:

**A. Everyday life, for mechanics.**

| Concept | Analogy used |
|---|---|
| Atomic transactions | "when I'm going to Dubai, I want to book my flights only if I get a hotel booking" |
| Blockchain client | "setting up a server to receive emails on a machine" |
| Token launch vs points | "A token launch is like a marriage… Points are closer to dates." |
| 200 ms latency | "roughly the time it takes to blink twice" |
| State fragmentation | the author's own two Chrome profiles |
| Requiring a wallet first | "like asking a user to sign up with a credit card before they can start using Facebook" |
| Middlemen in markets | "like having to sell your house through a chain of middlemen" |
| Network effects | restaurants vs a shopping mall |
| Agent marketplace | "think of it like Fiverr, but a programmable, agent-native version" |

**B. History, for theses.** DCo's best openings are history lessons that make a present-day argument.
- Early-90s AOL/CompuServe walled gardens → today's fragmented chains
- ImageNet and Fei-Fei Li → data as the binding constraint for AI
- Wheat domesticating humans (Sapiens) → AI domesticating us
- The Silk Road and Pax Mongolica → liquidity hubs and Hyperliquid
- The Buttonwood Agreement (1792) and commissions trending to zero → exchange economics
- Luddites (1811) → who owns machine output
- The Dutch East India Company → ownership structures for AI agents
- Herodotus's "silent trade" → stablecoins as a shared commercial language
- Sumerian cuneiform and pigeons and telegraphs → the data business
- Herman Miller after the dot-com bust → metaverse land after 2022
- Western Union telegraph boys → owning the last mile (Stripe)

**C. Business and TradFi, for strategy and valuation.**
- Google vs Yahoo (Drift vs competitors)
- Spotify vs SoundCloud (aggregation)
- LIBOR rigging and the LME nickel squeeze (why verifiability matters)
- Three Arrows Capital and Archegos (collateral blind spots)
- NYSE brokers (keeper bots)
- Robinhood and Schwab float income (who owns the yield)
- Rothschilds and JP Morgan railroads (controlling the rails)
- Asian Paints' 1970s mainframe (data moats, an Indian case)

**D. India and emerging markets: the house vantage point.**

| Concept | Example used |
|---|---|
| The cost of trust (blockchains vs institutions) | "It has taken me six months and endless calls to get a firm registered in India", against a DAO in "5 minutes and $200" |
| Dollar scarcity and stablecoin credit | a Nigerian importer paying a Chinese supplier (Keyrails) |
| Data as a moat | Asian Paints' 1970s mainframe |
| Behavioural data | "my preferences for eating biriyani on a Friday night" |
| IP-led aggregation | cricket streaming rights in India |
| Payment rails | UPI listed alongside ACH and Venmo; Tron for emerging-market payments |
| Liquidity concentration | the Bombay exchange alongside London and the NYSE |

**E. Coined metaphors that become the piece's vocabulary.**
- "completion machine" and "a compressed version of the internet" (LLMs)
- "Telegraph extractable value" (MEV, historically)
- "If data is food for AI training, then the models are what they eat."
- "gravity sink" (Hyperliquid's capital retention)
- "delivery-versus-lock" (programmable collateral)
- "toll booths" and "the landlord" (Stripe)
- "Data, like crude oil, has to undergo several steps of refinement"
- "DeFi projects are the new blackholes for stable assets."

**Rules for analogies**
1. **One analogy per concept, used twice at most.** Introduce it, then echo it once later. Dollars Are a Technology opens with silent trade and closes with "Tokenisation gave us words… Protocols give us the grammar to enforce it."
2. **Hedge historical leaps once, honestly:** "While it can be dangerous to reason by analogy, today's crypto landscape is strikingly similar to…"
3. **Carry the metaphor through the piece's architecture** when it's strong:
   - Building A Virtual Nation maps identity, banking, commerce, capital and physical layers onto nation-building.
   - Stripe's "relay race… each collecting a toll" becomes "toll booths on a highway it already owns" and then "Stripe is the landlord now".
4. **Prefer the specific to the generic.** "Twenty-four brokers… around a buttonwood tree" beats "early stock traders".

### 3.4 Worked examples: show the money
DCo explains mechanisms by **following a specific amount of money or a specific user through the system**, with numbers at every step.

- **Named persona** (Shlok): "Martin is new to crypto, and his favourite artist has just released new artwork as an NFT on Optimism for 0.1 ETH (~$300)… Joel only has USDC on Base." Then a diagram counts the steps: "There are at least 10 steps and 28 separate clicks." Later sections re-count the clicks as each fix is applied ("The number of clicks has gone down by almost half!").
- **Running transaction** (Stripe): "Consider a merchant in Singapore accepting a $200 payment from a customer in Berlin." Each of seven layers takes its cut, ending with "Roughly $13 of the original $200 is gone before the merchant sees the receipt."
- **Unit economics** (Joel): "Assume an institution holds $100M of tokenised treasuries yielding 5% annually. If it borrows at 98% loan-to-value (LTV)… The borrower's net cost is therefore roughly $880K, or about 0.9%…" It follows with what that means: "The borrower is not simply paying 6% to borrow. They are paying the spread…"
- **Side-by-side cost** (Saurabh): liquidating a $100,000 loan on Ethereum ("80,000 gas ($10-30)… slippage… $500-$2000") vs Hyperliquid ("2,100 gas for price data and 47,000 gas for execution"). This is then published as a clean comparison table.
- **Product walk-through** (Sumanth): "Imagine Substack charging $0.50 for a premium post. When you hit the 'Pay to Read' button, Substack returns a 402 code that includes the price, accepted asset… Your Metamask wallet authorises $0.50…"
- **Thought experiment** (Vaidik): "If you knew you could never sell this asset, what price would you pay for it? Everything above that price is just speculation."

- **Price-policy hypothetical** (Sumanth): "If The Economist posts '$0.02/article, cap $2/day,' a curious reader can bounce through 180 links without doing mental maths. At midnight, the protocol settles everything down to $2."
- **Option comparison** (Joel): "At a three-month tenor, a 20-25% annualised rate implies roughly 1% interest for the period… materially lower than paying a 20-30% FX premium upfront."
- **Revenue built layer by layer** (Stripe): "At $120 billion of annual volume and an average 30-basis-point spread, the FX layer generates roughly $360 million a year."
- **Scenario maths** (Drift memo): "If it were to simply return to its all-time high multiple of eighty, it would trade at an FDV of $1.58B. A more conservative and realistic outcome would be…"

**Rules**
- **Use real roles, not Alice and Bob.** DCo characters are "Martin, new to crypto", "a merchant in Singapore", "an importer in Nigeria", "an institution", "a searcher", or "you". Give them a motive ("it is a limited-edition mint") so the reader cares about the outcome.
- **Order steps as the money moves:** "Seven layers, roughly in the order the money touches them:"
- **Put clarifying asides right where confusion would arise:** "Keep in mind, this is the borrow rate, not the conversion rate".
- Use round, believable inputs ($100k, $200, $100M, 0.1 ETH) and say what they are.
- Show the arithmetic in prose, then restate the result in one plain sentence.
- Add the caveat on what's excluded ("before protocol fees, haircuts and any custodian fees"; "I'm being liberal here by assuming Martin already has a wallet").
- Thread one example through the whole piece when the topic is a stack or a flow.

### 3.5 Translate numbers into human scale
A raw number is never left alone. Give it a comparison, a ratio or a picture.

- "It processed $1.9 trillion in payments. That's about 6.5% of US GDP."
- "In other words, each stablecoin exchanged hands more than 6300 times."
- "16 times what Drift charges"; "roughly 43% of Binance's stated matching-engine capacity"
- "Ten thousand users paying $100 each is a $1-million ARR business in a world where churn does not exist."
- "A 40x return… Or a 99.8% drawdown."
- **Staccato framing for impact:** "15 million images. / 22,000 categories."
- **Time-stamp volatile figures:** "As of writing…", "As of June 22…", "as of writing this".

### 3.6 From data to insight: the chart sandwich
Every chart is **set up before, sourced beneath, and interpreted after.** Never let a chart speak alone.

1. **Set-up line** says what to look for: "The data below shows mentions of ICOs and launchpads in prominent crypto-native communities over the last few years." / "Consider the graph below tracking the product revenue for a sense of scale."
2. **The chart.**
3. **Caption**, which does one of three jobs:
   - cites the source: "Source: Delphi State of Tokens Report"
   - adds the insight: "ICOs captured retail attention but eventually gave way to 'launchpads' by exchanges—one instance of a narrative evolution in real-time."
   - adds a caveat: "Market-map is not representative of every player in every category."
4. **Interpretation** names the one number that matters and what it means: "As the chart above shows, user attention is short-lived. Revenue on Friend.tech has collapsed from over a million daily to under $20k each day as of writing this."
5. **Self-aware justification** when a chart might look naive: "You may wonder why we used a price chart here…"
6. **Point back into the chart:** "Do you see how that figure for new users flatlines in the chart above? That's the shrinking of userbases…"
7. **Twist and benchmark.** Find the second, less obvious reading and compare against a reference:
   - "What I find pretty telling… is that the TVL on Friend.tech has not declined…"
   - "One way to benchmark this growth is to compare MAUs with Metamask's…" → "Familiarity and history matter more to users here than points and marginal utility."
8. **Explain the method in plain words** when you build your own metric: "To benchmark whether the existence of tokens/points helped, I looked at metrics from T+3 months. That is, what portion of a cohort…"
9. **Name the mispricing** when the data supports an investment view: "That prices blockchains at nearly 4,000 times their annual fees and the applications at 17 times… an investor who knows where the fees are earned can see it."

### 3.7 Questions as scaffolding
DCo uses rhetorical questions to voice the reader's objection and then answer it at once. This keeps long pieces moving.

- "Wait, is this a different client? Yes and no."
- "How much data does it take to train a state-of-the-art generative model? / The answer: a lot."
- "Glamorous? Possibly not. Relevant in the current market? Absolutely."
- "Okay, there are issues, but what's being done to tackle them? Enter Jito…"
- "Now why am I mentioning this? Because…"
- "Don't believe me? Let's look at some of the aggregators…"
- **Section-ending question as a cliffhanger:** "But does it matter if revenue was created in the process? Friend.tech offers some clues." / "But what about the absolute crypto novice unaware of gas fees?" (which leads into *The First Abstraction*)
- **"Does that mean…? Not really."** Use it to stop readers drawing the lazy conclusion from a data point: "Does that mean it was a futile attempt? / Not really."
- **Why/How fragments:** "Why? Because…" / "How? They reduce…"

### 3.8 Signposting phrasebook
Long pieces need a guide. Use these freely, and don't use the same one twice in one piece.

| Job | Phrases from the archive |
|---|---|
| Roadmap | "In today's issue we examine… We end by discussing…" / "That is what this piece is about." / "This is what I set out to find answers to in today's piece." |
| Start | "Let's dive in!" / "Let's dig in." / "Okay, back to the story." / "On to the story now," |
| Scope | "Quick note before we dive in: this article is written from the perspective of…" / "This piece is not about… Instead, it seeks to understand…" |
| Define | "In simple terms," / "In simple words," / "Think of X as…" / "The useful phrase here is…" |
| Example | "Let's understand this with an example." / "An example will help explain this even better." / "Consider…" / "Imagine…" / "Let's say you…" |
| Restate | "In other words," / "Put simply," |
| Pivot | "Enter X." / "This brings us to X." / "That is where X comes in." / "To understand X, we need to understand how we got here in the first place." |
| Mechanism | "Let me explain how that happens." / "Consider the math at play." / "Strap in for a bit because I will have to explain the technical choices…" |
| Callback | "Remember the bit where I said…?" / "As discussed earlier," / "Joel already explored this in Money Moves." |
| Wrap | "Let's revisit the core argument of this piece before we wrap up." / "What to make of all of this?" |
| Skip | "A lot of ink has been spilled over bridge design… so I won't discuss them here. Besides, they are ancillary to the purpose of this post." |

### 3.9 Describing companies and founders
**Formula:** *category in plain words → what it does for whom → how it works (mechanism) → proof (numbers) → what makes it different → the risk.*

- **Category first, slogan second:** "Grass, a decentralised residential proxy provider… They call themselves the 'data layer of AI.' Let's first understand what a residential proxy provider does."
- **Mechanism in the company's own flow:** "When a user sends an order to Drift, the order routes through three forms of liquidity." Each form gets an H3 and the same treatment:
  - what it is;
  - an analogy ("Individual keepers are similar to brokers on the NYSE");
  - the benefit;
  - "The downside of such a model is…";
  - "The other assumption required for this to work is…"
- **Proof with current numbers:** "As of writing, USD.AI has roughly $398M in total value locked (TVL), with about $202M deployed in active loans."
- **First-hand use beats press releases:** "I used the product for a few weeks… You sign in with Google, set up 2FA…"
- **Founders** are introduced with a compact CV and why they're credible. They are quoted where their words carry the point: "As the founder Edison Lim puts it, they could focus on creating 'an operating system for on-chain finance'."
- **Balance:** praise is specific and earned, and scepticism is stated in the same voice. In sponsored work, promise it up front: "This piece explores whether the execution holds up to the ambition." / "And I will be honest about where it falls apart."

### 3.10 Handling uncertainty, risk and counter-arguments
- **State the thesis with conviction, then list its assumptions.** "The other assumption required for this to work is that a multitude of market-makers want the order flow…"
- **Steelman the obvious objection:** "An important caveat must be mentioned here regarding LTV and CAC. Too often, the industry criticises airdrops as a high CAC mechanism…"
- **Name competitors near the end** (MegaETH and Monad in Hyper Liquid; Arc and Plasma in Stripe).
- **Admit your own uncertainty plainly:**
  - "As I understand it…"
  - "How much is that attention worth? I don't know yet."
  - "I could be wrong in all of these predictions."
- **Separate storytelling from allocation:** "As storytellers, you can live in the hypotheticals. As capital allocators, you cannot."
- **Use structured verdicts:** "I think Hyperliquid has four distinct advantages. First… Second… Third… And lastly…"
- **Correct yourself in public:** "But there were flaws in my thinking." Then list the flaws.
- **Steelman both readings:** "One heuristic is to think crypto as a sector has gotten so efficient, that it no longer needs as much money… The other would be to acknowledge what broke along the way."
- **Name trade-offs plainly:** "Naturally, there are security trade-offs at play here." / "Will this be the antithesis of open money? Yes but it is also a direction towards scale."
- **Use scenario hedges, not vague hedges:** "If Gartner's directional number is even half right…" / "If the forecasts even partially come true… If they don't, Stripe still owns the merchant network."
- **Puncture your own hype:** "What is actually settling on agentic rails today is closer to a rounding error." / "which I know sounds like exactly the kind of thing you'd expect a crypto founder to say on a podcast… Except that this time, the metaphor holds up."
- **Cover the weaknesses of favoured subjects too.** The Solana piece covers outages and fee-market flaws in a broadly bullish essay. The Virtuals piece notes "94% of AI-agent tokens launched were pump-and-dump schemes".
- **Caveat the method:** "Please note that these plots are not exact… The idea is to develop a mental model"; "The metric above considers developers contributing to public repositories but not those building in private repositories".
- **Be ethically candid:** "It is acceptable to shut down a venture… (This was hard to write, but it must be mentioned)."
- **Treat founders with empathy:** "It is quite possible that the founder was building in the right market at the wrong time."

### 3.11 Reusable explanation templates

**The deep-dive arc** (most essays):
> Historical hook → pivot question → thesis and roadmap → the problem in detail → the mechanism (ladder in §3.1) → the players and case studies → numbers and charts → what it means and who wins → risks and competition → callback to the hook → sign-off

**The mechanism explainer** (one concept, inside a section):
> Why it matters → plain definition → everyday analogy → named example with numbers → diagram → real-world proof → one-line implication

**The company deep dive** (sponsored or portfolio):
> Disclosure → industry history → structural problem → how the company's design answers it (one H3 per component) → traction data → where it could fail → what we're watching

**The investment memo:**
> TL;DR (position, valuation, three reasons) → definitions block → why the market matters (historical case studies) → competitive landscape → how the protocol works → user and revenue data → valuation scenarios → catalysts → risks

**The sponsored or collaborative narrative** (Grvt, Virtuals):
> Greeting → sponsorship line plus a candour promise → dated historical vignette (1792, 1811, 1602) → the economic arc (costs trending to zero; ownership shifting) → the modern analogue's mechanism → a layered framework ("five layers of a nation", "three things users need") → the product as the answer to each layer → numbers → honest limits → forward look

**The startup case study** (Keyrails, SemiLiquid, USD.AI inside a larger essay):
> Real-world pain with regional specifics → "X comes in less as A and more as B" → flow mechanics → unit economics with arithmetic → contrast with the incumbent or DeFi alternative → cautionary history (3AC, Archegos) → "Its moat is…" → "In other words…"

**The market-behaviour essay** (*What's the point?*):
> Cycle framing → the incentive gap → definition → origin case → analogy → 3–5 data-backed case studies, each with a "Does that mean…? Not really." turn → taxonomy of where it works and where it fails → predictions → personal sign-off and further reading

**The history-to-present essay** (*Mapping The Data Landscape*):
> Deep-time hook ("All living things keep some record.") → industrial or financial-era case (Asian Paints, Bloomberg) → Web2 analogue (Google) → what's different in Web3 → taxonomy of personas or categories → moats → what's still open

**The data report** (early "State of…" pieces):
> News round-up → scope → one H3 per finding (heading *is* the finding) → chart plus interpretation → numbered predictions → data sources

---

## 4. Composition: anatomy of a DCo issue

### 4.1 The full stack (top to bottom)

| # | Block | Notes | Example |
|---|---|---|---|
| 1 | **Pre-roll / editor's note** (optional) | Above or just below the cover. Written by the editor (usually Joel) or the author. It covers why this piece exists, disclosures, house plugs (podcast, data products, community), a CTA, and a hand-off line. Labels vary: "Before we begin…", "Editor's notes", "Some notes before we begin." | "In the interest of disclosures, we were not in touch with anyone at Hyperliquid… On to the story now, / Joel." |
| 2 | **Cover image** | 2:1 template (see §9.3). | — |
| 3 | **Greeting** | "Hello," / "Hello there," / "Hey there,". Skipped in memos and some cold-open essays. | "Hello," |
| 4 | **Hook** | History, a personal anecdote, a striking stat, or an epigram. Specific dates, names and numbers. | "On May 17, 1792, a group of twenty-four brokers and merchants rallied around a buttonwood tree on Wall Street…" |
| 5 | **Pivot and thesis** | A question or one-line punchline turns the hook to crypto. | "Today, we simply call it the Internet." / "The metaverse, sadly, has no Herman Miller to bid on." |
| 6 | **Roadmap and scope** | What we cover, in what order, and what we don't. | "In today's issue we examine… We end by discussing…" |
| 7 | **Body** | 3–7 H2 sections (H3 for components). They alternate between explanation, a chart, an analogy and a worked example. | — |
| 8 | **Synthesis** | Often titled as a question. Numbered advantages, predictions or a cheat sheet. | "What to make of all of this?" |
| 9 | **Close** | A callback to the hook, a forward tease, or a builder CTA. | "That's what we'll be digging into next…" |
| 10 | **Sign-off** | A present-participle quip plus a comma, then the first name or full name, linked to X. | "Signing off, / Saurabh Deshpande" |
| 11 | **Footer** | Disclaimer and disclosure, community / founder form / referral, "If you liked reading this, check these out next:" | "Disclaimer: No part of the article is either financial or legal advice." |

### 4.2 Formats

| Format | Typical length | Byline | Distinguishing features |
|---|---|---|---|
| **Deep-dive essay** | 3,000–7,500 words (archive median about 5k; some reach 10k+) | 1–3 authors | History hook, punning title, 4–7 H2s, charts every few hundred words. |
| **Sponsored / collaborative deep dive** | 5,000–9,000 | Author(s), "in collaboration with X" | Disclosure in the first screen and a promise of candour. Sponsor data is labelled. |
| **Investment memo** ("Why We Invested in…") | 5,000–6,000 | Partners | TL;DR, a definitions block, valuation tables, catalysts, positions disclosed. Sober tone. |
| **Data report** ("State of X – Qn YYYY") | 1,500–2,500 | Single | Findings as headings, numbered predictions, "Data Sources:" footer. |
| **Year-end / game plan** | 1,500–3,000 | The team | Thank-yous, lessons, editorial policy changes, themes for next year. Signed by one partner. |
| **Podcast episode post** | Short show notes | Host (Saurabh) | Title "Topic with Guest from Company"; one-line summary as the subtitle; runtime 40–80 min. Older episodes are numbered "Ep NN -". |
| **Field notes / series notes** | 2,000–4,000 | Single | Framed as "one of a series of notes". Shorter, opinionated. (2026 policy: "Not everything has to be a 40-minute long read.") |

### 4.3 Pacing
- **Visual every 300–600 words** in a deep dive: a chart, diagram, screenshot, meme or art.
- **A subhead every 600–1,200 words.**
- **Re-anchor** after any long technical stretch with an aside, a joke or a one-line paragraph.
- **Email realities:** long pieces get clipped. Say so in the pre-roll: "The article may break in your e-mail client. Use the view in browser button…"

---

## 5. Titles, subtitles and headings

### 5.1 Titles
Short (2–5 words), conceptual and often punning. The title is the hook; the subtitle does the explaining.

| Pattern | Examples |
|---|---|
| Pun on the subject's name | *Hyper Liquid* · *The Pull of Grvt* · *Enter The Sanctum* |
| Pop-culture or idiom riff | *The Data Must Flow* · *What's the point?* · *Make Revenue Great Again* · *How to Lose Friends* |
| Gerund phrase | *Abstracting Chains* · *Pricing the Internet* · *Building A Virtual Nation* · *Orchestrating Flow* |
| Paradox or pair | *Using Chains, Taming Minds* · *Non-Consensus and Right* · *Cynical Optimism* |
| Provocative claim | *Dollars Are a Technology* · *Everything is a Market* · *Has Crypto Failed?* |
| "On X" essay | *On Aggregation Theory And Web3* · *On Solver Economics* · *On OEV* |
| Plain explainer | *Why Stripe built its own chain* · *Why We Invested in Drift Protocol* · *How to Market Make $500 Million a Week* |
| Series | *State of Stablecoins – Q3 2020* · *Year In Review – 2024* · *Game Plan for 2026* |

### 5.2 Subtitles
One short phrase that decodes the title, often a metaphor or a twist. A full stop is optional (pick one per piece).
- *Hyper Liquid* → "Liquidity as a Moat"
- *Mapping The Data Landscape* → "From Telegraphs to subgraphs."
- *What's the point?* → "Are points pointless?"
- *The Narrative Wedge* → "A field guide to profit and survival."
- *Going Institutional* → "ZKsync as a Call Option on Enterprise Adoption"
- *Coming of Age* → "Speculative Premia -> Fundamentals"

### 5.3 Section headings
- **House rule:** Title Case, 1–5 words, evocative.
- **Use the same playful register as the title:** *Show Me The Data* · *Subscription Hell* · *The Messy Middle* · *Can't Eat Pizza Tokens* · *Mistakes Were Made* · *Proof Of Work* · *Money Movers* · *So Decentralised* · *Trending to Zero* · *The Countertrade* · *Vibes*.
- **The last section may be a question**, often echoing the title: *What to make of all of this?* · *What's The Point?*
- **Run-in mini-heads** for taxonomies: a bold lead word with a full stop, then the explanation ("**Sovereignty.** …", "**Custody** is where funds sit…").
- **Analyst variant** (2026 Stripe piece, data reports): sentence-case headings that state the finding ("A billion in additional revenue"; "$428 billion moved on-chain this quarter"). Use these for data-heavy pieces only, and don't mix the two styles in one piece.
- **Hierarchy:** H2 for sections, H3 for components or case studies, H4 for personas or sub-types. Never skip down levels for looks.

---

## 6. Sentences and paragraphs

- **Paragraphs** run 2–5 sentences. One-sentence paragraphs are punchlines or pivots: "The critical resource is data." / "Today, we simply call it the Internet."
- **Sentence length:** mostly short to medium. Fragments are allowed for rhythm: "Even in data." / "Real. And human." / "Verifiable."
- **Lead with the claim**, then support it. Put the most quotable sentence last.
- **Lists:**
  - **Prose enumeration** ("First,… Second,… Third,… And lastly,…") for arguments.
  - **Bullets** for features, reasons, predictions and TL;DRs.
  - **Bold-lead bullets** for benefits ("**Acquisition and activation get cheaper.** …").
  - **Numbered lists** for steps and predictions.
  - List items are full sentences with sentence-case starts.
- **Asides** go in parentheses or after "Note:" / "Sidenote:". Footnotes (superscript numbers) are for side-stories and clarifications.
- **Block and pull quotes** are for primary sources and the people interviewed. Format: "… quote …" — Name, Title at Firm.

---

## 7. House mechanics (style sheet)

The archive is inconsistent on mechanics. **These are the normalised rules.** The column on the right records what the archive actually shows.

### 7.1 Spelling and terms

| Rule | Use | Not | Archive note |
|---|---|---|---|
| British -ise spelling | decentralised, tokenisation, realise, optimise, monetise, financialisation, incentivise | -ize | Dominant since 2020. -ize appears only in quotes and slips. |
| British forms | behaviour, colour, favour, labour, centre, programme, cheque, licence (n.), moulding, whilst (sparingly) | | "center" and "program" both slip in; use the British forms. |
| on-chain / off-chain | **on-chain**, **off-chain** (always hyphenated) | onchain | "onchain" appears only in 2026. |
| Web3 / Web2 | **Web3**, **Web2** (capital W, no space) | web3, Web 3 | Newer pieces often just say "crypto". Fine. |
| Internet | **the internet** (lowercase) | the Internet | The archive is split. Lowercase is the modern standard. |
| Self-reference | **Decentralised.co** (formal, first mention, disclosures); **DCo** (casual) | DCO, D.co | — |
| Crypto terms | DeFi, NFT(s), DAO(s), dApp(s), stablecoin, memecoin, L1/L2, TVL, FDV, MEV, RWA(s), perps, AMM, CLOB, RFQ | Defi, Dapp | Define on first use: "real-world assets (RWAs)". |
| Product casing | Use the project's own casing: MetaMask, DefiLlama, ZKsync, x402, LI.FI, Hyperliquid, Token Terminal, Dune | Metamask, DeFillama, ZKSync, X402 | All four "Not" forms appear in the archive. Check every name. |
| TL;DR | **TL;DR** | TL:DR, TLDR | The archive has "TL:DR". Standardise. |

### 7.2 Numbers and money

| Item | Rule | Examples |
|---|---|---|
| Large money | **Compact suffix, no space**, capital letter: $4T, $1.9B, $98M, $880K | not "$1.05 Billion", not "$ 1.4B" |
| | In literary or narrative prose, words are fine: "$6.9 billion in revenue" | Pick one style per piece. |
| Small money | $0.50, $13, $10k for casual figures | — |
| Percentages | Numeral plus %, no space: 0.3%, 61.9% | not "100 %" |
| Basis points | bps (10 bps) | — |
| Multiples | 40x, 3.5x | — |
| Approximations | ~$300, roughly, about; ± for ranges of error | — |
| Ranges | En dash or "to": $1–5M, 20–25%, 3% to 4% | Repeat the unit when ambiguous: $500–$2,000 |
| Thousands separators | Always from 1,000: 6,300; 4,000; 25,000 | The archive has "6300" and "4000". |
| Number words | Spell out one to nine and narrative or historical numbers ("twenty-four brokers", "Twelve thousand years ago"); digits otherwise | — |
| Dates | Month Day, Year: May 17, 1792. Short form in tables: Jan 2026. Quarters: Q4 2025 | not "Jan of 2026", not "March 8th" |
| Time-stamps | "As of writing" plus a date for any live metric | — |
| Tickers | Uppercase, no $ by default: SOL, ETH, HYPE, USDC. A $ prefix is only for memecoins or wordplay ($WIF, "Eating the $Chip") | — |

### 7.3 Punctuation
- **Dashes:** use the em dash (—) unspaced for interruptions, and the en dash (–) for ranges. The archive's spaced hyphen " - " is a habit to retire.
- **Quotes:** double quotes for speech and quotations; single quotes for coined or scare terms ('super app', 'chain abstraction').
- **Ellipses:** a single "…" character. Avoid ".." (an archive typo).
- **Serial comma:** use it.
- **Exclamation marks:** at most one or two per piece, for genuine delight ("Let's dive in!").

### 7.4 Copy-editing traps seen in the archive
Fix all of these before publishing:
- Stray full stops mid-sentence: "A custodian holds the funds briefly. on the EUR to SGD conversion."
- Typos: "on-chian", "inspite", "With all that out of the day".
- Inconsistent names and tickers within one piece ($VIRTUAL vs $VIRTUALS; x402 vs X402).
- Mixed money formats in one piece.
- Caption formats drifting ("Source -", "Source –", "Source-", "Source :").

---

## 8. Sourcing, credit, disclosure and ethics

### 8.1 Sourcing
- **Hyperlink the claim itself**, on the verb or the number: "The Times sued", "Google agreed to pay", "68.5%".
- **Prefer primary sources:** filings, company newsrooms, research papers (BIS, Odlyzko), and on-chain dashboards (Dune, DefiLlama, Token Terminal, Artemis).
- **Share your data** where possible ("Data: DefiLlama (source)", linking to a public sheet).
- **Credit explainers generously**, with adjectives: "this excellent article by Jon Stokes, this delightful video by Andrej Karpathy, or… this brilliant book by Stephen Wolfram".
- **Don't repeat what others covered well; link it:** "Packy McCormick… covered Solana's early history extensively… So we won't be repeating it."
- **Book recommendations** are welcome: "Many of these ideas are caught well in *The Price of Time*…"

### 8.2 Crediting people
- Credit inspiration up front: "This article was originally inspired by a note Marc from OMVC had sent us."
- Thank-you rolls list names with firms in parentheses and link their X profiles.
- Cross-reference colleagues by name ("An analogy my colleague Saurabh likes to use…", "Sid describes points as honey…").
- Credit artists and chart makers in captions ("Art by @handle", "Chart by Hildobby on Dune").

### 8.3 Disclosure: the non-negotiables

| Situation | Required language (adapt) | Placement |
|---|---|---|
| DCo holds a position | "Over the past month, we built a position in X." | First screen, plus a footer Disclosure |
| Portfolio company mentioned | "one of our own portfolio companies" / "Decentralised.co owns a minority stake in X" | Inline at first mention, plus the footer |
| Sponsored or collaborative | "This piece is a sponsored collaborative exploration written with the team at X." / "written in collaboration with X" | First screen |
| Not sponsored | "This is not a sponsored issue." Optionally: "we were not in touch with anyone at X" | Pre-roll |
| Personal holdings | Per author: "Saurabh has minor exposure…" | Pre-roll |
| Data from the subject | Caption: "Internal data shared by the X team" / "Proprietary data from X." | Under the chart |
| General | "Disclaimer: No part of the article is either financial or legal advice." | Footer |

Since 2026, house policy is to be *more* explicit: "We will be more explicit with our commercial investments… you will see more of our investments being covered on the newsletter."

### 8.4 Corrections
Correct errors publicly in the next issue's editor's note: say what was wrong, thank the readers who caught it, and give the right fact. Archive example: "we wrote that Prasanna was the founder of Ripple… Our ardent readers were quick to point out the error. Prasanna was formerly at Rippling."

### 8.5 Calls to action
Keep them founder-facing and human:
- "If you are building, make sure to drop your decks here. We may be able to help."
- venture@decentralised.co
- "Pitch to DCo", "Form for Founders", "Work with us"
- The Telegram community

**One CTA in the pre-roll and one in the footer. Never mid-argument.**

---

## 9. Visual design

### 9.1 Brand identity

| Element | Spec (observed) |
|---|---|
| **Logo / monogram** | A hand-inked, slightly distressed blackletter-style "D" with a reading lamp and a paper scroll set into the counter. Charcoal (#333231) to black (#000000). Used alone (no wordmark) as the avatar and as a watermark on covers and charts. |
| **Masthead** | "Decentralised.co" / "Research on all things Web3. For builders. By builders." |
| **Substack accent** | #9A6600 (deep ochre, the publication's theme "pop" colour). Used for buttons and links in the Substack shell. |
| **Ground** | White to warm off-white (#FEFEFD to #FFFFFF). Generous whitespace. |
| **Primary type (covers, editorial charts)** | A classical old-style serif with long ascenders and calligraphic italics (EB Garamond-like). Titles are large and regular weight. Dates are set in tracked small caps ("JUNE 2026"). |
| **Secondary type (tables, data UI)** | A neutral neo-grotesk sans (Inter-like). Small uppercase labels for column heads and notes. |
| **Informal type (2024-era diagrams)** | A hand-lettered, marker or comic-style font in uppercase (labels like "CHATGPT RELEASE"). |
| **Tone of imagery** | Literate, editorial, slightly antique: engravings, oil-paint textures, classical architecture, archival photos. It is never neon "crypto" aesthetic. |

### 9.2 Colour palette (sampled from published charts and covers)

| Role | Hex | Where it appears |
|---|---|---|
| Ink | #333231 / #161A1A | Logo, text, black chart lines |
| Paper | #FFFFFF / #FEFEFD | Backgrounds |
| Lavender paper | #D7DDEC | Textured background of hand-drawn charts |
| Lavender line | ≈ #9B87D9 | Line series in hand-drawn charts; numbered step badges |
| Mint | #B7EFD6 | Process-flow boxes (Abstracting Chains) |
| Sea-glass teal | #97C5C2 | Quadrant tiles (x402 landscape) |
| Slate | #5C6876 / #7B8D99 | Table headers, secondary series |
| Ochre (accent) | #9A6600 | Substack buttons and links |
| Category pastels | lilac, pink, mint, peach | Market-map category frames |
| Cover accents | olive #6E845F, sage #9EAA82, rust #AB7854, teal #4E9BA7 | Painterly cover art |

**Rule:** one muted accent per graphic plus ink, grey and paper. Save saturated colour for the single data point you want the eye to hit.

### 9.3 Cover template (2024–2026)
- **Format:** 2:1 landscape (2400×1200 or 2912×1456; minimum 1456×728). Older covers were 1600×900 (16:9).
- **Layout:**
  - **Left half:** a square-ish illustration inset with margin, or full-bleed to the left edge.
  - **Right half:** the title in large serif (2 lines max), then a short thin horizontal rule (about 100px, light grey), then the subtitle in small serif sentence case, then (optional) the date in tracked small caps, with the **monogram** bottom-right.
  - Optional: a partner logo inline after the subtitle in sponsored pieces (e.g. the Starknet mark).
- **Illustration styles:**
  - painterly or oil-texture scenes with a visual pun (robots seated in a parliament for *Building A Virtual Nation*; figures climbing a ladder on a dollar-green field for *Dollars Are a Technology*);
  - classical architecture (a Greek-temple bank for *Going Institutional*);
  - engraved or etched objects in a grid (commodities for *The Pull of Grvt*);
  - a currency close-up (*Keeping It Private*);
  - a diagram as the cover (a 2×2 "Consensus / Non-consensus × Wrong / Right" matrix with pastel red ✕ and green ✓ discs).
- **Earlier eras:** Unsplash photography with a credit line (2022); commissioned illustration credited in the caption (2023–24, e.g. "Art by @boldleonidas"); hidden-reference covers ("See if you can spot all the curated references made in the image.").

### 9.4 Charts and diagrams
Four families are in use. Pick one family per piece.

**A. Hand-drawn explainer style** (2024 deep dives: Shlok and Joel)
- Light lavender textured "paper" background.
- Lavender or purple line series.
- Hand-lettered uppercase titles and axis labels ("NUMBER OF CHAINS OVER TIME (DEFILLAMA)").
- Annotation callouts in boxed handwriting with curved arrows ("CHATGPT RELEASE").
- Process flows as rounded mint boxes with ink outlines, plus numbered lavender circles for click counts.
- Monogram bottom-right.
- 16:9 at 3200×1800.

**B. Editorial serif style** (2026: Joel and Vaidik)
- White background.
- Bold serif chart title plus a smaller serif subtitle describing the measure ("Commission on a single retail stock trade, 1975–2019").
- Single black series with open-circle markers and direct value labels ($70, $30, … $0.00).
- Faint horizontal gridlines only.
- Italic footnote: "Figures indicative. Data from NYSE, Ameritrade, Charles Schwab, Fidelity and E*Trade."
- Title often echoes a section heading ("Trending to Zero").
- Quadrant landscapes use the same serif title, axis words at the four edges, and teal tiles of logos.

**C. Clean data table / UI style** (Saurabh's comparisons)
- Sans-serif.
- Bold title ("Comparing Cost of $100k Lending Liquidation").
- A coloured one-line takeaway under the title ("Hyperliquid infrastructure provides more than 99% cheaper execution").
- Thin rules, a bold Total row.
- Uppercase footer note plus credit: "NOTE — … / TABLE: SAURABH DESHPANDE FOR DECENTRALISED.CO".
- Monogram.

**D. Native tool exports** (Dune, DefiLlama, Token Terminal, Datawrapper-like)
- Acceptable for fast data with a proper credit line ("Chart: Joel John for Decentralised.co • Source: TokenTerminal").
- Keep axis labels legible at email width.
- Strip clutter: "Removed data for a number of smaller platforms for ease of reading."

**Market maps**
- Logo tiles grouped in pastel-framed categories with bold uppercase category labels.
- A big title block ("THE AI AGENT LANDSCAPE"), plus the monogram.
- Always captioned with the "not meant to be exhaustive" caveat.

**Conceptual 2×2s**
- Hand-drawn axes (ink), a few labelled points, and a dotted arrow showing direction of travel (e.g. "DeFi ···→ ?" on *Permissionless × Capital-efficient*).

**Valuation and scenario tables** (memos)
- Spreadsheet-style with a navy or slate header band, shaded base-case column, and fine print stating assumptions above the table.

### 9.5 Captions
- **Format:** `Source: Name` (colon, one space, link on the name). Variants: `Data: Name`, `Chart by Name on Dune`, `Art by @handle`, `Image from Name.`
- **Optional second sentence:** the insight or the caveat.
- **Witty captions** are welcome on memes, archival photos and art. Data captions stay factual.
- **Market maps:** "Not meant to be exhaustive."

### 9.6 Other image types
- **Screenshots** of tweets, product UIs, wallets and terminals, used as evidence. Crop tightly.
- **Archival images** (newspaper clippings, telegraph boys, cuneiform tablets, film stills) carry the history hooks.
- **Memes and GIFs:** at most one or two per piece, captioned.
- **Embedded post cards** link back to earlier DCo pieces.

### 9.7 Distribution furniture (Substack)
- Inline "Subscribe" buttons every few sections (Substack default).
- **Button labels in house voice:** "Pitch to DCo", "Form for Founders", "Get in Touch", "Work with us", "Stalk Web3 VC Activity".
- Auto-generated audio voiceover is attached to posts.
- Homepage: Substack "newspaper" layout. Navigation: Home · Podcast · About.
- The About page uses a greyscale "TRUSTED BY READERS AT" logo wall (5×5 grid on a light-grey rounded panel).

---

## 10. Author voices (reference)

All authors share the house voice. These are the individual inflections to preserve when co-writing.

| Author | Signature traits |
|---|---|
| **Joel John** (editor) | Writes pre-rolls and CTAs. Aphoristic; investor lens (CAC/LTV, TAM, float, P/E). Market-cycle and history hooks (Herodotus, Buttonwood). Self-aware humour and quirky sign-offs ("Learning how to make iced V60 coffee,"). Many rhetorical questions; candid scepticism about the industry. |
| **Saurabh Deshpande** | Big-history and TradFi analogies (wheat, the Silk Road, the Rothschilds, factory electrification). Worked cost and gas maths and comparison tables. "Think of it as…" / "It's rather like…" similes. Structured verdicts ("First… And lastly…"). "Hello there," / "Signing off,". Hosts the podcast. |
| **Shlok Khemani** | The most explanatory writer, pitched at newcomers. Running personas (Martin), click counts, personal anecdotes. Roadmap paragraphs and "Let's dive in!". Numbered footnotes, em dashes, generous crediting. |
| **Siddharth (Sid) Jain** | Ventures lens; co-bylines memos and annual plans. Quoted for crisp metaphors ("points as honey"). Sign-off "Sliding into the weekend,". |
| **Vaidik Mandloi** | Grand historical sweep (Luddites → VOC → Carlota Perez → gladiators). A single extended metaphor carried through (nation-building). Attributed pull quotes. Explicit honesty in sponsored work. Clean "Source: X" captions. |
| **Sumanth Neppalli** (with Nishil Jain) | Consumer pricing frameworks (2×2s). Crisp epigrams ("People paid more to think less."). Life anecdotes (badminton courts). Witty captions; teases the next piece. "Watching ads on Prime,". |

---

## 11. Checklists and templates

### 11.1 Pre-publish checklist
**Substance**
- [ ] Is the thesis statable in one sentence, and is it in the first screen?
- [ ] Does the hook pay off (callback at the end)?
- [ ] Is every new concept taken up the explanation ladder (§3.1)?
- [ ] Is there at least one worked example with real numbers?
- [ ] Is every chart set up, sourced and interpreted (§3.6)?
- [ ] Are risks, assumptions and competitors named?
- [ ] Is there a clear "what this means for builders/investors"?

**Trust**
- [ ] Are positions, sponsorship and portfolio links disclosed in the first screen and the footer?
- [ ] Are sponsor-provided data labelled?
- [ ] Are all live metrics time-stamped ("As of writing…")?
- [ ] Does every factual claim link to a source?

**Craft**
- [ ] Is the title short and conceptual, with the subtitle decoding it?
- [ ] Are headings Title Case, evocative and in one consistent style?
- [ ] Is there an aphorism at the end of each major section, and no more?
- [ ] Is there a visual every 300–600 words?
- [ ] Are paragraphs 2–5 sentences, with one-liners only as pivots?

**Mechanics**
- [ ] -ise spellings; on-chain; Web3; the internet
- [ ] $4T / $98M / $880K money format; 1,000 separators; % with no space
- [ ] Product names in their official casing; tickers consistent
- [ ] "Source: X" captions throughout
- [ ] Em dashes, not spaced hyphens; TL;DR
- [ ] Typos and stray full stops checked

**Furniture**
- [ ] Pre-roll with CTA and a hand-off line (if needed)
- [ ] Greeting, sign-off (quip plus name), disclaimer, "check these out next"

### 11.2 Skeleton: deep-dive essay

```markdown
[Editor's note — optional]
Context for why this piece exists. Disclosure. One CTA.
On to the story now,
Joel

[Cover: 2:1, illustration left, serif title right]

Hello,

[HOOK — a specific historical scene or personal anecdote with dates, names, numbers. 2–4 paragraphs.]

[PIVOT — one-line paragraph that turns the hook toward crypto.]

[THESIS + ROADMAP — "In today's issue, we… We then… Finally, we…" + scope note.]

Let's dive in.

## [Evocative Heading 1 — the problem]
[Stakes → data → chart sandwich → aphorism]

## [Evocative Heading 2 — the mechanism]
[Explanation ladder: define → analogy → worked example → diagram → proof]

### [Component A] / ### [Component B]
[What it is → analogy → benefit → "The downside…" → "The other assumption…"]

## [Evocative Heading 3 — the players / numbers]
[Case studies, market map ("not meant to be exhaustive"), comparison table]

## [Question heading — What to make of all of this?]
[First… Second… Third… And lastly…; competitors; what we're watching]

[CALLBACK to the hook. Final aphorism.]

[Topical quip],
[Author name]

Disclosure: …
Disclaimer: No part of the article is either financial or legal advice.
If you liked reading this, check these out next: [2–4 links]
```

### 11.3 Skeleton: investment memo

```markdown
TL;DR:
- Decentralised.co is [increasing exposure to / has built a position in] X.
- At [valuation metric], we believe it is [mis]priced because:
  1. … 2. … 3. …

To keep terminologies tight, we use the following throughout this note:
Earnings – … Revenue – … [etc.]

## Why [the market] needs [property]   ← historical case studies in boxes
## Understanding [the ecosystem]        ← competitors, share charts
## Where X Differs                      ← one H3 per mechanism
## The Numbers                          ← users, revenue, take rate
## Valuation                            ← scenario table, stated assumptions
## Catalysts
## Risks
Disclosure: positions, data provenance ("Internal data shared by the X team").
```

### 11.4 Skeleton: data report

```markdown
Hey there,
[News round-up: 2–3 relevant developments, linked]
[Scope: what this report covers; "Side note:" primer links for newcomers]

### [Finding stated as a sentence, with the number]
[Chart] → [2–3 paragraphs interpreting it]
(repeat for 4–6 findings)

### So What's Next
1. [Prediction]  2. [Prediction]  3. [Prediction]
I could be wrong in all of these predictions.

Data Sources: …
[Sign-off],
[Name]
```

### 11.5 Phrasebook (quick reference)
- **Openers:** "Hello," · "Hello there," · "Hey there,"
- **Hand-offs:** "Okay, back to the story." · "On to the story now," · "Let's dive in." · "Let's dig in."
- **Explain:** "Think of it like this." · "In simple terms," · "Let's understand this with an example." · "Consider the math at play." · "Imagine…" · "In other words,"
- **Pivot:** "Enter X." · "This brings us to X." · "That is where X comes in." · "Now why am I mentioning this?"
- **Caveat:** "The downside of such a model is…" · "The other assumption required for this to work is…" · "An important caveat must be mentioned here…" · "As I understand it,"
- **Wrap:** "What to make of all of this?" · "Let's revisit the core argument of this piece before we wrap up."
- **Sign-off:** "Signing off," · "[Doing something topical]," · "Peace,"

---

## Appendix A — Pieces read for this book

| Piece | Date | Author(s) | Why it was chosen |
|---|---|---|---|
| State of Stablecoins – Q3 2020 | Oct 2020 | Joel John | Earliest era; data-report format |
| On Aggregation Theory And Web3 | Mar 2022 | Joel John | Top post; early essay voice |
| A New Internet *(metadata only)* | Jun 2023 | Joel John, Siddharth | Top post |
| The Narrative Wedge | Aug 2023 | Joel John | Top post; TL;DR and founder cheat sheet |
| Mapping The Data Landscape | Oct 2023 | Saurabh Deshpande | Top post; history-to-market-map arc |
| The Solana Ecosystem | Jan 2024 | Saurabh, Joel, Siddharth | #1 top post; disclosure preamble |
| What's the point? | Feb 2024 | Joel, Siddharth, Saurabh | Analogies, airdrop economics |
| The Data Must Flow | May 2024 | Shlok Khemani | Newcomer-level explanation craft |
| Abstracting Chains | Aug 2024 | Shlok Khemani | Persona walk-through; hand-drawn diagrams |
| Using Chains, Taming Minds | Dec 2024 | Saurabh Deshpande | Big-history analogy; market maps |
| Hyper Liquid | Jun 2025 | Saurabh Deshpande | Worked cost comparison; verdict structure |
| Pricing the Internet | Nov 2025 | Sumanth Neppalli, Nishil Jain | Frameworks; x402 explanation |
| Game Plan for 2026 | Jan 2026 | Joel, Siddharth, Saurabh | Editorial policy |
| Why We Invested in Drift Protocol | Mar 2026 | Joel, Siddharth, Saurabh | Investment memo format |
| Why Stripe built its own chain | May 2026 | Saurabh, Vaidik Mandloi | Running transaction example; analyst headings |
| The Pull of Grvt | Aug 2026 | Joel John, Vaidik Mandloi | Sponsored deep dive; editorial charts |
| Dollars Are a Technology | Aug 2026 | Joel John | Series note; unit-economics examples |
| Non-Consensus and Right | Aug 2026 | Saurabh, Joel, Siddharth | Latest long-form; pull quotes |
| Building A Virtual Nation | Aug 2026 | Vaidik Mandloi | Extended metaphor; candour in sponsored work |

Also reviewed: the About page (mission and principles), the Archive (Latest and Top), Substack publication metadata, 6 covers, and 12 charts and diagrams.

## Appendix B — Publication facts (as of Oct 2026)
- The Substack publication was created in March 2022. The archive also holds 2019–2021 pieces migrated from Joel John's earlier newsletter (links in those posts still point to cipher.substack.com).
- 274 posts in the sitemap; over 24,000 subscribers (masthead).
- Core team: Joel John, Siddharth Jain, Saurabh Deshpande. Recurring writers: Shlok Khemani, Vaidik Mandloi, Sumanth Neppalli, Nishil Jain, Jose Sanchez, Oliver Jaros.
- Rhythm: historically three articles a week (About page); 2026 policy is fewer, shorter notes plus deep dives and the podcast.
- Post word counts in recent issues: 3,100–7,400.
