# Problem Set 2: Prep Sheet

## Part II: Rate Shock tool

Open `rate_shock.html` in any browser. It needs no installation or internet connection.

**How it prices the bonds:** It interpolates the par yields to every year from 1 to 30, bootstraps annual spot rates, and discounts each cash flow. A shock adds the same amount to every par yield, re-bootstraps and reprices. YTM is solved from each price. Macaulay D = Σ t·PV(CF)/P and D* = D/(1+YTM).

### Part 2: Move the slider

| | Price today | +1% | +3% |
|---|---|---|---|
| Bond 1 (2Y, 5%) | $1,011.83 | −1.85% | −5.39% |
| Bond 2 (10Y, 5%) | $1,022.86 | −7.45% | −20.35% |
| Bond 3 (30Y, 5%) | $974.12 | −13.72% | −33.62% |
| Bond 4 (30Y, 2%) | $517.36 | **−16.58%** | **−39.67%** |
| **Portfolio** | **$3,526.17** | **−$314 (−8.9%)** | **−$795 (−22.6%)** |

- **Loses the most (in %):** Bond 4, the 30Y 2% bond. **Loses the least:** Bond 1, the 2Y bond.
- **In dollars,** Bond 3 loses the most (−$328 at +3%) because it is worth about twice as much as Bond 4. Mention this if the CFO asks where the dollar loss is.
- **What the big losers have in common:** they are long maturity bonds, and the worst one also has a low coupon. Most of their value comes from cash flows far in the future.

### Part 3: Duration

| | Macaulay D | Modified D* | Estimate at +1% | Actual at +1% | Estimate at +3% | Actual at +3% |
|---|---|---|---|---|---|---|
| Bond 1 | 1.95 | 1.87 | −1.87% | −1.85% | −5.62% | −5.39% |
| Bond 2 | 8.13 | 7.77 | −7.82% | −7.45% | −23.46% | −20.35% |
| Bond 3 | 15.96 | 15.18 | −15.32% | −13.72% | −45.93% | −33.62% |
| Bond 4 | 19.47 | 18.50 | −18.78% | −16.58% | −56.30% | −39.67% |
| Portfolio (value-weighted) | 10.18 | 9.70 | −9.7% | −8.9% | −29.1% | −22.6% |

- **Yes, the ranking matches exactly.** The higher the duration, the bigger the fall.
- **The rule of thumb works well for +1%**, where every estimate is within about 2 points. **For +3% it overstates the loss**, and the gap grows with duration. That gap is **convexity**: the real price–yield curve bends, so losses grow more slowly than the straight-line duration estimate. On the "price change across all shocks" chart, the lines are curves, not straight lines.
- Bond 4's Macaulay duration (19.5) is well below its 30-year maturity, and a 30Y bond with a higher coupon (Bond 3) has a lower duration (16.0). **Duration is the average time until you get your money back, weighted by value.**

### Part 4: Plain-English answers for the CFO

**Why do long, low-coupon bonds fall the most?**
Their money comes back late. A 30-year 2% bond pays small coupons and returns most of its value only in year 30. When rates rise, every future dollar is discounted more heavily, and the most distant dollars are hit hardest because the higher rate compounds over 30 years. A low coupon means less money comes back early to cushion the blow. Duration puts all of this into one number: roughly the % loss for each 1% rise in rates.

**What did SVB get wrong?**
SVB took in short-term deposits, which customers could withdraw at any time, and invested them in long-dated Treasuries and mortgage bonds to earn a bit more yield. Those assets had no credit risk but a lot of interest-rate risk, and SVB didn't hedge it. When the Fed raised rates quickly in 2022–23, those bonds lost a lot of market value. The losses sat unrecognized in "held-to-maturity" accounting until depositors got nervous and withdrew their money. SVB then had to sell bonds at a loss, which made the problem real and set off a run. **The mistake was a duration mismatch: long assets funded by short, runnable liabilities.**

**Before a series of rate hikes, would you rather hold short or long bonds?**
Short ones. They have low duration, so they lose little when rates rise (Bond 1 loses about 5% at +3%, while Bond 4 loses about 40%). They also mature soon, so the bank can reinvest the cash at the new, higher rates. Long bonds lock in today's lower yield and take the biggest mark-to-market hit.

### About a 2-minute video script

> "Here is our Treasury book: four bonds with $4,000 of face value, worth $3,526 today, priced off the current Treasury curve.
>
> This slider shifts the entire yield curve. If rates rise 1%, *(click +1%)* we lose about $314, or 9% of the portfolio. At +3%, *(click +3%)* we lose about $795, or 22.6%.
>
> Look at which bonds take the hit. *(point at bars)* The 2-year barely moves: down 5% even at +3%. The 30-year bonds lose 34 to 40%. The worst is the 30-year 2% coupon bond, because almost all of its value arrives in year 30.
>
> The number that explains this is duration. *(scroll to table)* The 2-year's modified duration is about 1.9, while the 30-year 2% bond's is 18.5. Duration roughly tells you the % loss for each 1% rise in rates, and it lines up with the slider: at +1% the estimates are within a point or two. For big moves like +3%, duration overstates the loss a bit because of convexity: the price curve bends.
>
> The whole portfolio has a duration of about 9.7, so every 1% rise in rates costs us roughly 9 to 10% of its value.
>
> This is exactly what sank SVB. They funded long-duration bonds with deposits that could leave overnight. When rates rose, the bonds dropped, depositors ran, and the losses became real.
>
> My recommendation: if we expect more hikes, shorten our duration. Let the long bonds roll off, or hedge them, and hold shorter bonds that we can reinvest at higher rates."

---

## Part I: How to do each question in Excel

> Part I is marked **"Exercises without AI"**, so this section gives the method and Excel setup but not the answers. Work the numbers yourself. Once you have them, you can check them against a classmate or the lecture solutions.

**General setup:** Use one column for time t (0.5, 1, 1.5, …), one for the cash flow, one for the discount factor, and one for PV = CF × DF. The price is `=SUM(PV column)`.

- **Semiannual conventions:** Spot rates are quoted as annual rates with semiannual compounding. Semiannual coupon = Face × c / 2. Discount factor: `=1/(1+r/2)^(2*t)`.

**Q1: Price from spot rates.** For a 6% note with $100 face, the coupon is $3 every 6 months and the final cash flow is $103 at t = 3. Discount each cash flow at its own spot rate and sum.

**Q2 (extra credit): Par coupon rate.** For a bond priced at 100: 100 = (c/2)·100·ΣDF + 100·DF(3), so **c = 2·(1 − DF₃) / ΣDFᵢ**. Alternatively, use Goal Seek on the coupon cell (Data → What-If → Goal Seek) until the price is 100.

**Q3: STRIPS → spot rates.** Z_t = 100/(1+r_t/2)^(2t), so **r_t = 2·((100/Z_t)^(1/(2t)) − 1)**.
- (b) Future value = $150 × (100/Z₁.₅), because each $Z you invest grows into $100.
- (c) PV = $20 × Z₁/100.

**Q4: YTM.** Use `=RATE(nper, pmt, pv, fv)*2` with nper = 10, pmt = 45, pv = −950 and fv = 1000. **Remember to multiply by 2** to annualize. Sanity check: the bond sells below par, so its YTM must be above the 9% coupon.

**Q5/Q6: Prices and YTMs.** Price each bond from the spot rates as in Q1, then get each YTM with `RATE`, using 3 periods and ×2.
- **The idea to understand:** YTM is a weighted average of the spot rates, weighted toward whichever dates carry the most cash flow value. The low-coupon bond (B) puts relatively more weight on its final cash flow, so its YTM sits closer to the long spot rate r₁.₅.
  - When the curve is **upward sloping** (Q5), B has the **higher** YTM.
  - When the curve is **inverted** (Q6), it flips.
- You should find that the answer changes between the two questions. That change is the point of the exercise.

**Q7: The full workflow.**
- (a) Get the spot rates as in Q3.
- (b) Get the price as in Q1, using a $3.25 coupon.
- (c) Get the YTM with `RATE`.
- (d) Get Macaulay D by adding a column of **t × PV(CF at YTM)**, summing it, and dividing by the price. Here t is in **years**, and the discounting uses YTM, not the spot rates.
- (e) **D* = D / (1 + YTM/2)**. Use /2 because of semiannual compounding. Then ΔP/P ≈ −D* × 0.002.
- For the exam, remember the Part II version used annual coupons, so D* = D/(1+YTM). **With semiannual coupons, divide by (1+YTM/2).**

### Practice problem (different numbers), with answer

Spot rates: r₀.₅ = 4%, r₁ = 4.5%, both semiannual compounding. Price a 1-year, 8% semiannual bond with $100 face.

Cash flows are $4 at t = 0.5 and $104 at t = 1.
- DF₀.₅ = 1/1.02 = 0.98039
- DF₁ = 1/1.0225² = 0.95648
- Price = 4(0.98039) + 104(0.95648) = **103.39**
- YTM = `RATE(2,4,-103.39,100)*2` ≈ **4.49%**
- Macaulay D ≈ (0.5·3.912 + 1·99.48)/103.39 ≈ **0.981 yr**
- D* = 0.981/1.02245 ≈ **0.960**
