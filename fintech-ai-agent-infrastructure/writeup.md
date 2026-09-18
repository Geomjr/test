# FinTech – AI Agent Infrastructure

*One-page write-up in the CVF Application template format (Thesis → Overview → Tailwinds → Role → Chart → Trends → Market Map). All observations come from posts on X between Sep 2025 and Sep 18, 2026, pulled via Crustdata’s Twitter tool and X-restricted web search; see `sources.md`.*

**Thesis:** Every neobank and fintech is rushing to let AI agents interact with its accounts, cards and payments. None of them will keep pace with how quickly the technology is moving while also running a regulated payments company. That gap creates the opportunity for an infrastructure player to build the agent connectivity layer once—identity, permissions, protocols, controls and cover—and sell it across the neobank ecosystem.

**Overview:** In twelve months on X, agent access moved from demo to roadmap at nearly every consumer and business fintech. Robinhood opened “agentic accounts” and a credit card that agents can spend from (May 2026); Revolut launched its AIR assistant (Apr), let outside AI assistants connect to Revolut X (Jul) and ran France’s first live “AI pays for you” card payment with Visa (Sep); Ramp and Oobit issued cards for agents; Brex rebuilt itself as an “AI-native finance platform”; Mercury shipped tools so agents can act on accounts; Starling launched an agentic assistant for businesses; Klarna backed Google’s commerce protocol and moved shopping into ChatGPT; Airwallex published an agent toolkit; and Alipay’s AI Pay cleared 120M agent transactions in a single week. On the supply side, Verda Ventures counts 950 agentic-payments startups, 377 founded in 2026, and McKinsey expects agents to mediate $3–5T of commerce by 2030.

**Tailwinds for Agent Infrastructure:** The shift has staying power and significant growth potential because:

- Every network now offers an agent rail
- Neobanks now compete on being “agent-ready”
- Stablecoins and tokenized Treasuries give agents 24/7 money and yield
- Micro-payments fall below card economics
- Regulators are forming working groups, not bans
- Insurers have started to price agent risk

**The Role of the Connectivity Layer:** Seven agent-payment standards shipped in a single year—Google’s AP2, Stripe and OpenAI’s ACP, Visa’s Trusted Agent Protocol, Shopify and Google’s UCP, Stripe and Tempo’s MPP, Mastercard’s Agent Pay for Machines and the x402 Foundation, now under the Linux Foundation with Visa, Mastercard, Stripe, Amex, Google and AWS as members. A regulated fintech has to keep its licences, fraud controls, anti-money-laundering programme and customer support running; it cannot also re-integrate a new agent standard every quarter. The posts on X show each firm solving the same problem alone: a “side project” at Revolut, a two-month build at Mercury, a home-grown security gateway at Brex.

The first wave of embedded finance solved a similar problem—every fintech needed bank APIs, cards and compliance, and providers such as Plaid, Marqeta and Lithic built them once and sold them to everyone. I believe the same pattern repeats for agents, with one important reality check: demand is still forming. x402’s daily volume fell 93% from January to September, merchants pulled back from chatbot checkout, and a quarter of surveyed executives cite customer distrust as the blocker. The winners will attach to real, recurring machine spend—business payments, software, data and treasury—rather than to speculative consumer shopping, and will make the hard parts boring for the neobanks they serve.

**Chart – Who opened rails to AI agents, by month** (author’s tally of announcements on X; Sep 2026 partial through 9/18)

| | Sep-25 | Oct | Nov | Dec | Jan-26 | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Banks, neobanks & fintech apps | 0 | 1 | 1 | 0 | 0 | 2 | 1 | 3 | 3 | 1 | 3 | 3 | 3 |
| Infrastructure, networks & insurers | 2 | 1 | 1 | 1 | 1 | 1 | 4 | 3 | 6 | 5 | 5 | 3 | 3 |

**I believe that firms will build solutions that address the concepts and trends shown below:**

- **The agent connectivity layer for neobanks**

  Each fintech is currently wiring itself to agents by hand: Revolut’s engineers connected Revolut X to outside AI assistants as a side project, Mercury built a command-line tool for agents in two months, Robinhood stood up its own agent connection point, and Brex had to write and open-source its own security gateway (CrabTrap, “Okta, but for agents”) because nothing off the shelf existed. Every one of them did the same work alone, on top of running a licensed business.

  Infrastructure firms already sell this once and distribute it widely: Plaid links bank data to ChatGPT and Grok, Fireblocks and Coinbase pitch “let your users safely delegate spending to agents” to fintechs, Crossmint powers agent wallets for Wirex’s seven million users, and Fiserv’s agentOS lets six pilot banks run their own, Fiserv’s and partners’ agents under one set of controls. I believe a single plug that handles agent identity, permissions, protocol translation and monitoring—sold across hundreds of neobanks—is the largest opportunity in the category.

- **Agent identity, compliance and risk**

  Know-your-customer checks the human; the agent acting for them has no passport. Visa now gives vetted agents a digital signature, Mastercard adds agent credentials, Google’s protocol carries a signed record of what the customer authorized, and in September Ant International, Visa and Mastercard announced a shared “know your agent” framework. 176 of the 950 agentic-payments startups tracked by Verda work on identity and authorization alone.[^1]

  The next layers are delegated-authority proofs (which person or business an agent acts for and within what limits), anti-money-laundering monitoring tuned to agent flows—TRM Labs reports a roughly 500% rise in AI-enabled scams—and, eventually, liability cover for agent overspend. The Emerging Payments Association Asia and HSBC formed a working group on exactly these questions, and the Bank of England has said its frameworks “were not built to contemplate autonomous agents.”[^4]

- **Agent wallets and spend policy**

  The breakout products of 2026 were cards and wallets with rules attached. Ramp Agent Cards launched with spend limits, merchant controls and full visibility; Robinhood’s agentic credit card lets a customer “set spend rules”; Oobit’s agent cards carry merchant-category restrictions and hard caps; Alchemy issues one-time virtual Visa cards on demand; Coinbase and Fireblocks enforce scoped, revocable permissions in a policy engine; Google tells users to “begin by setting strict guardrails.”

  The pattern is one wallet per agent with a budget, per-task caps, counterparty whitelists, time windows, approval thresholds and one-time credentials, so a compromised agent cannot exceed its authority. The rulebook is the product; the rail beneath it is interchangeable.

- **Machine-to-machine payments and metering**

  Agents need to pay per API call or hire another agent for a few cents, which card economics cannot serve: 76% of agent transactions fall below Visa’s $0.30 fee floor.[^3] Coinbase’s x402, Stripe and Tempo’s Machine Payments Protocol and Mastercard’s Agent Pay for Machines all target this, and Amazon’s AgentCore now lets agents pay for APIs, data and other agents mid-task. Billing tools are following: Paid raised $21M for agent billing, and Cursor moved from seats to per-run pricing.

  The reality check is volume—x402’s daily settlement fell 93% from January to September and much of the December peak was synthetic[^5]—so I expect metering to win first in business software and data, not consumer shopping.

- **Yield and cash management**

  Agents hold stablecoin balances that sit idle between tasks. Tokenized U.S. Treasuries grew from about $5B in May 2025 to roughly $15B in May 2026, Circle’s USYC became the largest tokenized money-market fund, and Securitize reported $24.3B in assets under administration.[^6] Nubank’s new Nu Global account turns every deposit into a stablecoin; Coinbase lists “treasury, yield, automated allocation and agentic capital management” as the next layer of its stablecoin stack.

  I believe business accounts will sweep idle agent balances into tokenized Treasury funds and back automatically, with the agent itself doing the sweeping under a policy the finance team sets.

- **Insurtech for AI**

  Insurers began writing AI exclusions into ordinary liability policies this year, and a handful—startups and at least one major carrier—now sell coverage for the failures of AI agents.[^7] The Artificial Intelligence Underwriting Company raised $55M to audit and insure agents and wrote the first policy for ElevenLabs’ voice agents; Risklytics (YC S26) brokers cover for companies whose agents “do work in the world”; Munich Re agreed to buy cyber insurer At-Bay for $575M.

  As one investor put it, insurance pricing “pushes companies to pass 5,000 adversarial tests before an agent is allowed anywhere near production.” Cover for agent overspend and mis-execution will be bundled with wallets and connectivity, much as chargeback protection is bundled with cards today.

- **Agent-native accounts and treasury for AI-run businesses**

  A new class of customer is forming: companies run largely by software. ClawBank offers FDIC-insured virtual accounts for “zero-human companies,” Catena Labs is building what it calls the first AI-native financial institution, Anchorage Digital and Google Cloud launched a regulated “Agentic Banking” layer that enforces corporate spending policy before settlement, and HSBC is opening a centre in Singapore focused on agentic treasury.

  Brex and Airwallex say agents will run most of the finance back office. The neobank that serves these customers well will need every layer above—identity, wallets, metering, yield and insurance—delivered as one product.

**Market Map**

| Layer | Examples seen on X |
|---|---|
| Connectivity & Protocols | Adyen Agentic, Stripe Agentic Commerce Suite, x402 Foundation, Fiserv agentOS, Plaid, Crossmint, ACP · UCP · AP2 · MPP |
| Identity, Compliance & Risk | Visa Trusted Agent Protocol, Mastercard credentials, Ant/Visa/MC KYA framework, Kite AI, Billions, TRM Labs, Sardine |
| Agent Wallets & Spend Policy | Ramp Agent Cards, Robinhood agentic card, Oobit, Alchemy AgentCard, Coinbase Agentic Wallets, Fireblocks, Brex CrabTrap |
| M2M Payments & Metering | x402, Machine Payments Protocol, Mastercard Agent Pay for Machines, AWS AgentCore payments, Paid, Floe, Skyfire · Payman |
| Yield & Cash Management | Circle USYC, BlackRock BUIDL, Ondo, Franklin Templeton BENJI, Securitize, Superstate, Nu Global |
| Insurance for AI | AIUC, Armilla AI, Risklytics, Munich Re / At-Bay, Lloyd’s market |
| Agent-Ready Neobanks & Fintechs | Robinhood, Revolut, Ramp, Brex, Mercury, Starling, Klarna, Airwallex, Alipay |
| Agent-Native Banking | ClawBank, Catena Labs, Anchorage / Google Cloud, Natural, HSBC agentic treasury |

**Notes**

[^1]: Stablescape stablecoin market map, 6,128 companies (Aug 2026, Verda Ventures)
[^2]: McKinsey agentic-commerce estimate via @rohanpaul_ai (Mar 2026)
[^3]: State of Agents 2026 / Keyrock: 76% of agent transactions below Visa’s $0.30 fee floor
[^4]: Bank of England Deputy Governor Sarah Breeden (Jul 2026, via @samboboev); EPAA/HSBC working group (Jul 2026, via @sygnumofficial)
[^5]: Agentic payment rail shows volume decline (Sep 2026, American Banker)
[^6]: Tokenized Treasuries: Binance Research via @injective (May 2026), @Ondo/Allium (Jun 2026), @circle (Mar 2026), @Securitize Q2 2026 results
[^7]: NBC News (Nov 2025); @SamGGld Risklytics launch (Aug 2026); AIUC via @justindross (Feb 2026)
