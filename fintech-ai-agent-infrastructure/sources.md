# Sources – FinTech – AI Agent Infrastructure (neobank connectivity-layer version)

Trend observations in `writeup.pdf` come from public posts on X (Twitter) and the articles those posts link to, gathered on 2026-09-18. Two collection paths were used:

- **Crustdata `crustdata_get_twitter_posts`** (by handle) for fintech, infrastructure and commentator accounts. Handles that returned usable posts: @RevolutApp, @nubank, @Klarna, @airwallex, @RobinhoodApp, @bunq, @Plaid, @lithic, @treasuryprime, @crossmint, @chainalysis, @trmlabs, @Securitize, @circle, @superstatefunds, @MunichRe, @oost_marcel, @brexHQ, @Wise, @RWA_xyz. Several handles failed with connection errors or rate limits (e.g. @n26, @StarlingBank, @qonto, @Marqeta, @catena_labs, @OndoFinance, @ArmillaAI, @mikulaja) and ambiguous handles returned unrelated posts (@mercury, @sardine, @Anchorage).
- **Web search restricted to x.com / twitter.com** to fill the gaps by topic (x.com itself is blocked by the sandbox proxy, so post text was read from the indexed snippets).

Post dates are decoded from the tweet IDs. No prior model knowledge was used for the substance of the piece.

## Neobanks & fintechs opening rails to agents
| Date | Handle | Post |
|---|---|---|
| 2025-10-09 | @taxologyin | Razorpay, NPCI and OpenAI “Agentic Payments” UPI pilot — https://x.com/taxologyin/status/1976307914106429941 |
| 2025-11-05 | @pedroh96 (Brex) | “Introducing AI agents that do your finances” — Brex as AI-native finance platform — https://x.com/pedroh96/status/1986095893636854125 |
| 2026-02-02 | @Klarna | Klarna supports Google’s UCP, building on AP2 — https://x.com/Klarna/status/2018390711805043172 |
| 2026-02-13 | @Alipay | AI Pay exceeded 120M transactions in a week — https://x.com/Alipay/status/2022124009937416264 |
| 2026-03-04 | @linasbeliunas | Revolut engineers built an AI trading workflow with Claude; Revolut X MCP server as a side project — https://x.com/linasbeliunas/status/2029165197466976665 |
| 2026-03-11 | @RampLabs | Ramp Agent Cards — https://x.com/RampLabs/status/2031792565066891555 |
| 2026-04-09 | @bankier_pl / @maxkarpis | Revolut launches AIR, AI personal banker — https://x.com/bankier_pl/status/2042153042674356496 · https://x.com/maxkarpis/status/2041452697295954250 |
| 2026-04-21 | @sytaylor / @pedroh96 | Brex open-sources CrabTrap, “Okta, but for agents” — https://x.com/sytaylor/status/2046640169806377364 · https://x.com/pedroh96/status/2046605307372093932 |
| 2026-04-30 | @obchakevich_ | Oobit Agent Cards backed by Tether: merchant-category restrictions, hard caps — https://x.com/obchakevich_/status/2049853316713099746 |
| 2026-05-01 | @mercury | Building the Mercury CLI (agents act on financial workflows; MCP and API available) — https://x.com/mercury/status/2050273511537885329 |
| 2026-05-20 | @AIStockSavvy | Klarna launches Shopping Search inside ChatGPT — https://x.com/AIStockSavvy/status/2057061654106411290 |
| 2026-05-27 | @amitisinvesting / @backbase | Robinhood launches Agentic Trading and an Agentic Credit Card via MCP servers — https://x.com/amitisinvesting/status/2059667155914813484 · https://x.com/backbase/status/2060299550678462728 |
| 2026-06-05 | @RobinhoodApp | Agentic trading available to all customers — https://x.com/RobinhoodApp/status/2062924679178842367 |
| 2026-07-10 | @Revolut | Revolut X now connects with your AI assistant — https://x.com/Revolut/status/2075576080774172938 |
| 2026-07-20 | @RobinhoodApp | “Robinhood is now open to AI agents” — agentic accounts — https://x.com/RobinhoodApp/status/2079195918595764300 |
| 2026-07-29 | @financialit_net | HSBC Global AI Centre of Excellence in Singapore: agentic treasury — https://x.com/financialit_net/status/2082527767208308737 |
| 2026-08-17 | @Alipay | China’s first full-stack agentic commerce platform — https://x.com/Alipay/status/2089353045620523141 |
| 2026-08-24 | @financialit_net | Starling Bank launches agentic AI assistant for business — https://x.com/financialit_net/status/2091814984934404143 |
| 2026-08-31 | @RobinhoodApp | “Your AI agent can now trade crypto” — https://x.com/RobinhoodApp/status/2094491408514077009 |
| 2026-09-08 | @maxkarpis / @fadouce | Revolut and Visa run France’s first live “AI pays for you” card payment — https://x.com/maxkarpis/status/2097196821428760967 |
| 2026-09-10 | @oost_marcel / @sytaylor | Nubank launches in the US; Nu Global turns deposits into stablecoins — https://x.com/oost_marcel/status/2098084675516240004 · https://x.com/sytaylor/status/2098098885990486325 |
| 2026-09-11 | @Sino_Market | Alipay AI wallet agent; VibePay, SkillPay, MachinePay — https://x.com/Sino_Market/status/2098279515902640302 |
| 2026-09-15 | @airwallex | Airwallex connector for Claude; toolkit for AI agents — https://x.com/airwallex/status/2099930412567175396 |

## Infrastructure providers, networks & protocols
| Date | Handle | Post |
|---|---|---|
| 2025-04-11 | @lithic | “Built for Agentic Payments” — https://x.com/lithic/status/1910736884130865645 |
| 2025-09-16 | @GoogleCloudTech | Agent Payments Protocol (AP2) — https://x.com/GoogleCloudTech/status/1967942818065768558 |
| 2025-09-29 | @stripe / @patrickc | Agentic Commerce Protocol, Shared Payment Tokens — https://x.com/stripe/status/1972712679128052136 |
| 2025-10-14 | @jackforestell | Visa Trusted Agent Protocol — https://x.com/jackforestell/status/1978088755928936702 |
| 2025-11-11 | @GoKiteAI | Agent Passports — https://x.com/GoKiteAI/status/1988065414316744758 |
| 2026-01-11 | @BenjaminDEKR | ACP vs UCP — https://x.com/BenjaminDEKR/status/2010437207958647080 |
| 2026-02-11 | @CoinbaseDev | Agentic Wallets — https://x.com/CoinbaseDev/status/2021647661871640726 |
| 2026-03-06 | @ethereum | ERC-8004 — https://x.com/ethereum/status/2029991772961788238 |
| 2026-03-09 | @MilkRoadAI | Alchemy AgentCard on Claude Desktop — https://x.com/MilkRoadAI/status/2030826968900350435 |
| 2026-03-18 | @stripe / @Delphi_Digital | Machine Payments Protocol — https://x.com/stripe/status/2034257912973963374 · https://x.com/Delphi_Digital/status/2036635434525319546 |
| 2026-03-31 | @pymnts | Visa and Ramp bill-pay agents — https://x.com/pymnts/status/2039085754991714715 |
| 2026-04-08 | @coinbureau | Visa Intelligent Commerce Connect — https://x.com/coinbureau/status/2041949194483855716 |
| 2026-04-22 | @deepseektetra | ClawBank: FDIC-insured virtual accounts for agents — https://x.com/deepseektetra/status/2046767052048994766 |
| 2026-04-24 | @samboboev | Backbase AI-native banking OS — https://x.com/samboboev/status/2047558205698388309 |
| 2026-05-06 | @Cointelegraph | Anchorage + Google Cloud Agentic Banking — https://x.com/Cointelegraph/status/2051925063075545399 |
| 2026-05-07 | @awscloud | AgentCore payments: agents pay for APIs, MCP servers, other agents — https://x.com/awscloud/status/2052391393213976872 |
| 2026-05-07 | @base | Agents on AWS pay in USDC on Base — https://x.com/base/status/2052396407600910344 |
| 2026-05-14 | @Fiserv | agentOS, six FIs piloting — https://x.com/Fiserv/status/2054882141654102144 |
| 2026-05-15 | @kimmonismus | ChatGPT personal finance via Plaid — https://x.com/kimmonismus/status/2055320528198521041 |
| 2026-05-20 | @FireblocksHQ | Agentic Payments Suite; Agentic Wallets for fintechs — https://x.com/FireblocksHQ/status/2057085439463276681 · https://x.com/FireblocksHQ/status/2057085453212205489 |
| 2026-05-20 | @marty_kausas | Cursor moves Bugbot to per-run pricing — https://x.com/marty_kausas/status/2057140155215921525 |
| 2026-06-10 | @Mastercard | Agent Pay for Machines, 30+ partners — https://x.com/Mastercard/status/2064690323683529210 |
| 2026-06-11 | @FloeLabs | Per-use budgets for voice agents — https://x.com/FloeLabs/status/2065200699101860133 |
| 2026-06-17 | @samboboev | Adyen Agentic, “universal translator” — https://x.com/samboboev/status/2067127707607916902 |
| 2026-06-18 | @CryptoEconomyEN | Alchemy AgentCard on Visa — https://x.com/CryptoEconomyEN/status/2067706826687217938 |
| 2026-06-25 | @Plaid | Plaid’s sequential foundation model — https://x.com/Plaid/status/2070160073121247438 |
| 2026-07-14 | Linux Foundation | x402 Foundation operational launch, 40 members — https://www.linuxfoundation.org/press/linux-foundation-announces-operational-launch-of-x402-foundation-to-standardize-internet-native-payments-for-ai-agents-and-applications |
| 2026-07-20 | @naturalpay | Natural $30M Series A — https://x.com/naturalpay/status/2079265920225357861 |
| 2026-07-20/21 | @samboboev / @sygnumofficial | EPAA + HSBC agentic payments working group — https://x.com/sygnumofficial/status/2079446276479873372 |
| 2026-08-26/28 | @crossmint | AI shopper that buys within a budget; agent wallets with rules enforced at the network layer; Wirex (7M users) adopts Crossmint — https://x.com/crossmint/status/2092648580326867055 · https://x.com/crossmint/article/2093352811169820901 · https://x.com/crossmint/status/1993320107284505086 |
| 2026-09-02 | @ClaudeDevs / @sytaylor | Claude Commerce Agents with Visa and Mastercard — https://x.com/ClaudeDevs/status/2095233745167282602 · https://x.com/sytaylor/status/2095457471892525488 |
| 2026-09 | PYMNTS | Ant International + Visa + Mastercard “know your agent” interoperability framework — https://www.pymnts.com/news/artificial-intelligence/2026/ant-international-unveils-100-products-to-drive-agentic-financial-operations/ |
| — | @cdixon | “Investing in Catena Part II” (AI-native financial institution) — https://x.com/cdixon/status/2057082357526438386 |
| — | @PaymanAI / @trySkyfire | Agent payments at financial institutions; agent payment network — https://x.com/PaymanAI · https://x.com/trySkyfire |

## Identity, compliance & risk
| Date | Handle | Post |
|---|---|---|
| 2026-02-26 | @billions_ntwk | KYA: Know Your Agent — https://x.com/billions_ntwk/status/2027017053631307926 |
| 2026-03-12 | @Tanaka_L2 | KYA as identity layer — https://x.com/Tanaka_L2/status/2031991288732786943 |
| 2026-07-01 | @samboboev | Bank of England’s Sarah Breeden on agentic AI — https://x.com/samboboev/status/2072319321326424414 |
| 2026-09-09 | @trmlabs | TRM Labs $2B valuation; ~500% rise in AI-enabled scams — https://x.com/i/article/2097697127094980963 |
| 2026-08-20 | @twifintech | 25% of executives cite user distrust — https://x.com/twifintech/status/2090409919530852623 |
| 2026-09-07 | @regulatorynerd | Banks’ blocking tooling vs. agents — https://x.com/regulatorynerd/status/2096998793040502944 |

## Yield & cash management
| Date | Handle | Post |
|---|---|---|
| 2026-01-08 | @SeiNetwork | Tokenized treasuries cross $9B — https://x.com/SeiNetwork/status/2009331759544975857 |
| 2026-03-12 | @circle | USYC is the world’s largest tokenized money market fund — https://x.com/circle/status/2032169763645100046 |
| 2026-04-03 | @WuBlockchain | rwa.xyz: tokenized assets $27.65B, Treasuries $12.78B — https://x.com/WuBlockchain/status/2040094260943352149 |
| 2026-05-14 | @ShiftRWA | $15B US Treasuries live on-chain — https://x.com/ShiftRWA/status/2054918106565451882 |
| 2026-05-23 | @injective | Binance Research: ~$15B tokenized Treasuries, ~$5B a year earlier — https://x.com/injective/status/2058175175259033795 |
| 2026-06-29 | @Ondo | Tokenized U.S. Treasury market crossed $14B (Allium) — https://x.com/Ondo/status/2071645432841728304 |
| 2026-08-12 | @Securitize | Q2 2026: $24.3B AUA — https://x.com/Securitize/article/2087633996188725666 |
| — | @coinbase | Treasury, yield, automated allocation, agentic capital management — https://x.com/coinbase/status/2064435868153131329 |

## Insurance for AI
| Date | Handle | Post |
|---|---|---|
| 2025-11-18 | @NBCNews | Insurers begin offering coverage for AI agent failures — https://x.com/NBCNews/status/1990852517740024282 |
| 2026-02-19 | @justindross | Insurance pricing pushes 5,000 adversarial tests before production; AIUC — https://x.com/justindross/status/2024557077650112554 |
| 2026-06-12 | @emily_yuan_ | AI coverage: autonomous AI bodily injury, service interruption, deepfake liability — https://x.com/emily_yuan_/status/2065502278577242429 |
| 2026-08-13 | @SamGGld | Risklytics launch (YC S26); insurers excluding AI from policies — https://x.com/SamGGld/status/2087946743212351723 |
| 2026-08-19 | @Calcalistech | Munich Re to acquire At-Bay for $575M — https://x.com/Calcalistech/status/2090004876809928874 |
| — | @aiunderwriting / @ArmillaAI | AIUC ($55M; AIUC-1; ElevenLabs policy); Armilla AI — https://x.com/aiunderwriting · https://x.com/ArmillaAI |

## Market context & reality checks
| Date | Handle | Post |
|---|---|---|
| 2026-03-02 | @rohanpaul_ai | McKinsey: agents to mediate $3–5T by 2030 — https://x.com/rohanpaul_ai/status/2028428632566427980 |
| 2026-03-06 | @natzir9 / @dofornop | OpenAI drops direct checkout in ChatGPT — https://x.com/dofornop/status/2030257819446829400 |
| 2026-03-25 | @pareekhjain | Walmart conversion ~3x lower via ChatGPT — https://x.com/pareekhjain/status/2036827724950761830 |
| 2026-05-03 | @sytaylor | “The AI does not own the checkout. The merchant does.” — https://x.com/sytaylor/status/2050906465154555994 |
| 2026-09 | American Banker | x402 volume down 93% YTD; Verda index 950 agentic-payments startups — https://www.americanbanker.com/payments/news/agentic-payment-rail-shows-volume-decline |
| 2026-08 | Verda Ventures | Stablescape: 950 agentic-payments companies, 377 founded in 2026, 176 on identity/authorization — https://stablescape.xyz/ |
| 2026 | Keyrock / State of Agents | 76% of agent transactions below Visa’s $0.30 fee floor — https://news.bitcoin.com/keyrock-report-76-of-ai-agent-transactions-fall-below-visas-0-30-fee-floor/ |

## Chart method
The chart counts the announcements listed above by month of the post. “Banks, neobanks & fintech apps” covers customer-facing financial companies opening accounts, cards or connections to agents; “Infrastructure providers, networks & insurers” covers protocols, wallets, identity, rails and insurance launches. September 2026 is partial (through 9/18).
