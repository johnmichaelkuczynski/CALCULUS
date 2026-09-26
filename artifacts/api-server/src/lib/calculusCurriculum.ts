// Four-week curriculum transcribed from calculus-course_1790452019652.pdf.
// Math is written as Markdown/LaTeX so it remains readable in the lesson reader.
export const calculusLectures: Array<{ number: string; title: string; blurb: string; body: string }> = [
  {
    number: "1.1", title: "The tangent and velocity problems", blurb: "The two questions that created calculus.",
    body: `# The tangent and velocity problems

Calculus began with two problems that turn out to be the same problem. The tangent problem asks for the slope of a curve at a single point. The velocity problem asks for the speed of a moving object at a single instant. Algebra cannot answer either directly, because a slope needs two points and a speed needs two times.

## Secant lines and average velocity
Between two points on the graph of $f$, the secant slope is the average rate of change:
$$m_{\\mathrm{sec}}=\\frac{f(x+h)-f(x)}{h}.$$
If $f(t)$ is position, this is average velocity over a time interval of length $h$.

## From average to instantaneous
Shrink $h$. The secant lines swing toward a limiting line—the tangent line—and the average velocities settle toward a limiting value—the instantaneous velocity. For $s(t)=16t^2$, the average velocity on $[2,2+h]$ is $64+16h$, which approaches 64 as $h$ approaches zero. Making “approaches” precise is the job of the limit.

## A real example
Around 450 BCE Zeno of Elea posed the arrow paradox: at any single instant a flying arrow occupies a space exactly its own size, so at that instant it is not moving—and since time is made of instants, it never moves. Calculus answers Zeno by defining velocity at an instant not from the instant alone but as the limit of average velocities over shrinking intervals around it. Newton and Leibniz each built the method in the late seventeenth century.`
  },
  {
    number: "1.2", title: "Limits", blurb: "What a function approaches, whether or not it gets there.",
    body: `# Limits

The limit of $f(x)$ as $x$ approaches $a$ is the value $f(x)$ gets arbitrarily close to when $x$ is sufficiently close to $a$—but not equal to $a$. The value $f(a)$ itself, or whether $f$ is even defined at $a$, is irrelevant.

## Notation and one-sided limits
$$\\lim_{x\\to a}f(x)=L.$$
The one-sided limits $\\lim_{x\\to a^-}$ and $\\lim_{x\\to a^+}$ approach from the left and right. The two-sided limit exists exactly when both one-sided limits exist and are equal. If $f(x)$ grows without bound, we write $\\lim f(x)=\\infty$ and the graph has a vertical asymptote.

## The precise definition
Intuition is not enough for proofs. The $\\varepsilon$–$\\delta$ definition says $\\lim_{x\\to a}f(x)=L$ if for every $\\varepsilon>0$ there is a $\\delta>0$ such that
$$0<|x-a|<\\delta\\implies |f(x)-L|<\\varepsilon.$$
However tight a tolerance $\\varepsilon$ you demand on the output, some tolerance $\\delta$ on the input guarantees it.

## A real example
In 1734 Bishop George Berkeley attacked Newton's calculus in *The Analyst*, mocking its vanishing increments as “ghosts of departed quantities”: they were treated as nonzero when dividing and as zero when discarded. The objection was sound, and it took more than a century to answer. Augustin-Louis Cauchy in the 1820s and Karl Weierstrass later in the century rebuilt calculus on the limit, and the $\\varepsilon$–$\\delta$ definition is Weierstrass's answer to Berkeley.`
  },
  {
    number: "1.3", title: "Computing limits", blurb: "The limit laws, algebraic tricks, and the squeeze theorem.",
    body: `# Computing limits

Limits obey arithmetic. If $\\lim f(x)$ and $\\lim g(x)$ both exist, the limit of a sum, difference, product, or quotient is the sum, difference, product, or quotient of the limits—provided no denominator limit is zero.

## Direct substitution and indeterminate forms
For polynomials, rational functions (away from zeros of the denominator), roots, and the other elementary functions, the limit is found by substituting $x=a$. When substitution gives $0/0$, the limit is indeterminate: factor and cancel, rationalize, or simplify first.
$$\\lim_{x\\to3}\\frac{x^2-9}{x-3}=\\lim_{x\\to3}(x+3)=6.$$

## The squeeze theorem
If $g(x)\\le f(x)\\le h(x)$ near $a$ and both $g$ and $h$ approach $L$, then $f$ approaches $L$ too. The squeeze proves the most important trigonometric limit:
$$\\lim_{x\\to0}\\frac{\\sin x}{x}=1.$$
Limits at infinity are handled by dividing by the highest power: the ratio of leading terms decides a rational function's horizontal asymptote.

## A real example
Archimedes, around 250 BCE, trapped $\\pi$ between the perimeters of polygons inscribed in and circumscribed about a circle. Doubling the number of sides from 6 up to 96, he proved $3\\frac{10}{71}<\\pi<3\\frac17$. The circle's perimeter is squeezed between two sequences closing in on the same value—the squeeze theorem, two thousand years before it had a name.`
  },
  {
    number: "1.4", title: "Continuity", blurb: "Functions whose graphs have no breaks.",
    body: `# Continuity

A function is continuous at $a$ if its limit there equals its value there.

## The definition
$$\\lim_{x\\to a}f(x)=f(a).$$
Three things are required: $f(a)$ is defined, the limit exists, and the two agree. Discontinuities are removable (a hole), jump (unequal one-sided limits), or infinite (a vertical asymptote). Polynomials, rational functions on their domains, roots, exponentials, logarithms, and trigonometric functions are continuous wherever they are defined, as are sums, products, quotients, and compositions of them.

## The intermediate value theorem
If $f$ is continuous on $[a,b]$ and $N$ lies between $f(a)$ and $f(b)$, then $f(c)=N$ for some $c\\in(a,b)$. A continuous function cannot skip values. In particular, a continuous function that changes sign must have a zero—the basis of the bisection method, which halves the search interval at each step:
$$f(a)<0<f(b)\\implies f(c)=0\\text{ for some }c.$$

## A real example
At every moment there are two diametrically opposite points on Earth's equator with exactly the same temperature. Let $T(\\theta)$ be the temperature at longitude $\\theta$ and let $g(\\theta)=T(\\theta)-T(\\theta+180^\\circ)$. Then $g$ at the opposite point is $-g$, so $g$ changes sign as $\\theta$ runs halfway around; by the intermediate value theorem it is zero somewhere. Continuity alone forces the result, with no measurement at all.`
  },
  {
    number: "1.5", title: "The derivative", blurb: "The instantaneous rate of change, defined by a limit.",
    body: `# The derivative

The derivative of $f$ at $x$ is the limit of the difference quotient—the slope of the tangent line, the instantaneous rate of change.

## The definition
$$f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}.$$
Leibniz's notation $dy/dx$ records it as a ratio of changes; Newton's dot notation survives in physics for time derivatives. The second derivative $f''$ is the derivative of $f'$—for position, it is acceleration.

## Differentiability
A function differentiable at $a$ is continuous there, but not conversely. A derivative fails to exist at a corner ($|x|$ at 0), a cusp, a vertical tangent (the cube root at 0), or any discontinuity. The tangent line at $a$ is
$$y=f(a)+f'(a)(x-a).$$

## A real example
Mathematicians long assumed continuous functions must be differentiable at most points. In 1872 Karl Weierstrass presented a function—an infinite sum of cosine waves of increasing frequency and decreasing height—that is continuous everywhere and differentiable nowhere. Its graph is all corners. The shock established that continuity and differentiability are genuinely different, and such functions later became the mathematics of fractals and Brownian motion.`
  },
  {
    number: "1.6", title: "Differentiation rules", blurb: "Computing derivatives without limits.",
    body: `# Differentiation rules

Applying the limit definition every time is impractical. A handful of rules, each proved once from the definition, differentiate every algebraic function.

## Power, sum, and constant rules
$$\\frac{d}{dx}x^n=nx^{n-1}.$$
The power rule holds for every real exponent $n$. The derivative of a constant is 0, constants factor out, and the derivative of a sum is the sum of the derivatives.

## Product and quotient rules
The derivative of a product is not the product of the derivatives:
$$ (fg)'=f'g+fg',\\qquad \\left(\\frac fg\\right)'=\\frac{f'g-fg'}{g^2}.$$
The quotient rule follows from the product rule applied to $f\\cdot(1/g)$. Higher derivatives are found by applying the rules repeatedly.

## A real example
Gottfried Wilhelm Leibniz published the first account of the differential calculus in 1684, in a six-page paper in the journal *Acta Eruditorum* titled “Nova Methodus pro Maximis et Minimis.” In it he stated the product rule in his own notation, $d(xv)=x\\,dv+v\\,dx$, along with the quotient and power rules—and the notation $dx,dy$ that students still use.`
  },
  {
    number: "1.7", title: "Derivatives of trigonometric and exponential functions", blurb: "The transcendental functions, and why radians and e are natural.",
    body: `# Derivatives of trigonometric and exponential functions

From the limit $\\sin x/x\\to1$ and the sum formula for sine, the derivatives of the trigonometric functions follow.

## Trigonometric derivatives
$$\\frac{d}{dx}\\sin x=\\cos x,\\qquad\\frac{d}{dx}\\cos x=-\\sin x.$$
The quotient rule then gives $\\frac{d}{dx}\\tan x=\\sec^2x$ and the rest. These formulas hold only in radians; in degrees each would carry a factor of $\\pi/180$.

## Exponential derivatives
Differentiating $b^x$ from the definition gives $b^x$ times a constant that depends on $b$. The number $e$ is the unique base for which that constant is 1:
$$\\frac{d}{dx}e^x=e^x,\\qquad\\frac{d}{dx}b^x=b^x\\ln b.$$
The exponential $e^x$ is its own derivative—the reason it describes every quantity whose rate of change is proportional to its size.

## A real example
A mass on a spring oscillates as $x(t)=A\\cos(\\omega t)$. Its velocity $x'(t)=-A\\omega\\sin(\\omega t)$ is zero at the extremes of the motion and greatest as it passes through equilibrium; its acceleration $x''(t)=-\\omega^2x$ is always proportional and opposite to displacement. Christiaan Huygens exploited this regular oscillation in the pendulum clock he built in 1656, which improved timekeeping accuracy from minutes to seconds per day.`
  },
  {
    number: "2.1", title: "The chain rule", blurb: "Differentiating compositions—the most used rule in calculus.",
    body: `# The chain rule

Most functions are compositions: $\\sin(x^2)$, $e^{3x}$, $\\sqrt{1+x^4}$. The chain rule differentiates them by multiplying rates of change.

## The rule
$$\\frac{d}{dx}f(g(x))=f'(g(x))\\,g'(x).$$
In Leibniz notation, if $y$ depends on $u$ and $u$ depends on $x$, then $dy/dx=(dy/du)(du/dx)$. Differentiate the outer function leaving the inner alone, then multiply by the derivative of the inner function.

## Longer chains
For compositions of three or more functions the rule repeats: each layer contributes a factor. Thus $\\frac{d}{dx}\\sin^3(2x)=3\\sin^2(2x)\\cos(2x)\\cdot2$. Nearly every derivative beyond the basic rules uses the chain rule, and its reverse—substitution—is the main integration technique of Week 3.

## A real example
Near sea level, air pressure falls about 1 inch of mercury for every 1,000 feet of altitude. An airliner climbing at 2,000 feet per minute therefore sees cabin-outside pressure change at $dP/dt=(dP/dh)(dh/dt)\\approx(-1/1000)(2000)=-2$ inches of mercury per minute. Pressurization systems are designed around exactly this product of rates.`
  },
  {
    number: "2.2", title: "Implicit differentiation and inverse functions", blurb: "Differentiating equations that are not solved for y.",
    body: `# Implicit differentiation and inverse functions

Curves such as $x^2+y^2=25$ define $y$ only implicitly. Implicit differentiation differentiates both sides with respect to $x$, treating $y$ as a function of $x$ and applying the chain rule to every $y$ term, then solves for $dy/dx$.

## The method
From $x^2+y^2=25$: $2x+2yy'=0$, so
$$\\frac{dy}{dx}=-\\frac{x}{y}.$$
At $(3,4)$ the tangent slope is $-3/4$, perpendicular to the radius, as geometry requires.

## Inverse functions and logarithms
Differentiating $f(f^{-1}(x))=x$ gives the derivative of any inverse, and in particular:
$$\\frac{d}{dx}\\ln x=\\frac1x,\\qquad \\frac{d}{dx}\\arctan x=\\frac1{1+x^2}.$$
Logarithmic differentiation—take $\\ln$ of both sides, then differentiate implicitly—handles functions like $x^x$ whose variable appears in both base and exponent.

## A real example
In 1638 René Descartes challenged Pierre de Fermat to find the tangent lines to the curve $x^3+y^3=3axy$, now called the folium of Descartes, expecting Fermat's method to fail. Fermat solved it. Implicit differentiation now does it in two lines: $3x^2+3y^2y'=3a(y+xy')$, so $y'=(ay-x^2)/(y^2-ax)$.`
  },
  {
    number: "2.3", title: "Related rates", blurb: "When two changing quantities are linked by an equation.",
    body: `# Related rates

If two quantities are related by an equation and both change over time, their rates of change are related by the derivative of that equation with respect to time.

## The procedure
1. Draw a diagram and name every changing quantity as a function of $t$.
2. Write an equation relating them—geometry, the Pythagorean theorem, similar triangles.
3. Differentiate both sides with respect to $t$ using the chain rule.
4. Only then substitute the numbers for the instant in question.

$$x^2+y^2=z^2\\implies xx'+yy'=zz'.$$

## The classic error
Substituting values before differentiating turns variables into constants and destroys their rates. A ladder's length is constant, so its rate is zero; the distances of its foot and top are not, so they must remain variables until after differentiation.

## A real example
A police radar gun measures the rate at which the distance to a car is changing, not the car's speed. From $z^2=x^2+d^2$, with $d$ the officer's distance from the road, $z'=(x/z)x'=v\\cos\\theta$. An officer standing off to the side therefore always reads low—the “cosine effect”—and the error grows as the car approaches. The discrepancy always favors the driver.`
  },
  {
    number: "2.4", title: "Linear approximation and Newton's method", blurb: "Using the tangent line to estimate and to solve.",
    body: `# Linear approximation and Newton's method

Near a point where $f$ is differentiable, its graph is nearly straight. The tangent line—the linearization—approximates $f$ nearby.

## Linear approximation
$$f(x)\\approx L(x)=f(a)+f'(a)(x-a).$$
Thus $\\sqrt{4.1}\\approx2+(1/4)(0.1)=2.025$ (true value $2.0248\\ldots$). In differential notation, $dy=f'(x)\\,dx$ estimates the change in $y$, and physics uses the same idea whenever it replaces $\\sin\\theta$ by $\\theta$ for small angles.

## Newton's method
To solve $f(x)=0$, start at a guess $x_n$, follow the tangent line to where it crosses the axis, and repeat:
$$x_{n+1}=x_n-\\frac{f(x_n)}{f'(x_n)}.$$
Near a simple root the number of correct digits roughly doubles with each step. The method can fail when $f'$ is near zero or the starting guess is poor.

## A real example
The 1999 video game *Quake III Arena* needed $1/\\sqrt{x}$ millions of times a second to light its 3D scenes. Its source code computed a rough initial guess by manipulating the bits of the floating-point number, then applied a single step of Newton's method to refine it—accurate to within about 0.2 percent and far faster than the hardware's division and square root at the time.`
  },
  {
    number: "2.5", title: "Extreme values and the mean value theorem", blurb: "Where maxima and minima can occur, and what derivatives guarantee.",
    body: `# Extreme values and the mean value theorem

The extreme value theorem guarantees that a continuous function on a closed interval $[a,b]$ attains both an absolute maximum and an absolute minimum. The question is where.

## Critical points
Fermat's theorem: if $f$ has a local extremum at an interior point $c$ and $f'(c)$ exists, then $f'(c)=0$. So extrema occur only at critical points—where $f'$ is zero or undefined—or at endpoints. The closed interval method evaluates $f$ at all of them and picks the largest and smallest:
$$f'(c)=0\\quad\\text{or}\\quad f'(c)\\text{ undefined}.$$

## The mean value theorem
If $f$ is continuous on $[a,b]$ and differentiable on $(a,b)$, then at some interior point the instantaneous rate equals the average rate:
$$f'(c)=\\frac{f(b)-f(a)}{b-a}.$$
Consequences: a function with zero derivative is constant, and a function with positive derivative is increasing.

## A real example
Average-speed cameras, used on British motorways, photograph a car at two points miles apart and divide the distance by the elapsed time. They never measure instantaneous speed. But if the average exceeds the limit, the mean value theorem guarantees that at some instant between the cameras the speedometer read exactly that average—so the driver was speeding at some moment, whether or not anyone saw it.`
  },
  {
    number: "2.6", title: "Curve sketching", blurb: "Reading the shape of a graph from its derivatives.",
    body: `# Curve sketching

The first and second derivatives describe a graph's shape completely enough to sketch it without plotting.

## The first derivative test
$f$ is increasing where $f'>0$ and decreasing where $f'<0$. At a critical point where $f'$ changes from positive to negative there is a local maximum; from negative to positive, a local minimum; no sign change, no extremum.

## Concavity and inflection
$f$ is concave up where $f''>0$ (bending upward, like a cup) and concave down where $f''<0$. A point where concavity changes is an inflection point. The second derivative test:
$$f'(c)=0,\\quad f''(c)>0\\implies\\text{local minimum at }c.$$
A complete sketch combines domain, intercepts, symmetry, asymptotes, intervals of increase, extrema, concavity, and inflection points.

## A real example
In the early weeks of the COVID-19 pandemic in 2020, epidemiologists watched cumulative case counts for an inflection point. While cumulative cases are concave up, daily new cases—the derivative—are rising; the inflection point is where daily cases peak and begin to fall. “Flattening the curve” meant reaching that inflection sooner and lower.`
  },
  {
    number: "2.7", title: "Optimization", blurb: "Finding the best possible value of a quantity.",
    body: `# Optimization

Optimization problems ask for the largest or smallest value of a quantity—area, cost, time, profit—subject to constraints. The derivative turns them into equation solving.

## The procedure
1. Identify the quantity $Q$ to optimize and draw a diagram.
2. Express $Q$ in terms of one variable, using the constraint to eliminate the others.
3. Find the domain, then the critical points where $Q'=0$.
4. Confirm the optimum by the closed interval method or a derivative test.

$$Q'(x)=0.$$

## Economic interpretation
Profit is maximized where marginal revenue equals marginal cost, $R'(x)=C'(x)$: the last unit produced adds exactly as much revenue as cost. A fence of fixed length enclosing the most area is a square; a can holding fixed volume with least material has height equal to its diameter.

## A real example
In 1662 Pierre de Fermat proposed that light travels between two points along the path that takes the least time. Minimizing the travel time of a ray crossing from air into water—setting the derivative of total time to zero—yields $\\sin\\theta_1/v_1=\\sin\\theta_2/v_2$, exactly Snell's law of refraction. An observed law of optics turned out to be the solution of an optimization problem.`
  },
  {
    number: "3.1", title: "Antiderivatives", blurb: "Running differentiation in reverse.",
    body: `# Antiderivatives

An antiderivative of $f$ is a function $F$ with $F'=f$. Because constants have derivative zero, antiderivatives come in families: if $F$ is one, every other is $F+C$.

## Basic formulas
Each derivative rule read backwards is an antiderivative rule:
$$\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C,\\qquad n\\ne-1.$$

- $\\int 1/x\\,dx=\\ln|x|+C$—the case $n=-1$;
- $\\int e^x\\,dx=e^x+C$;
- $\\int\\cos x\\,dx=\\sin x+C$ and $\\int\\sin x\\,dx=-\\cos x+C$.

## Initial value problems
A condition such as $F(0)=5$ selects one member of the family by determining $C$. Given acceleration, one antiderivative gives velocity and a second gives position, with the initial velocity and initial position as the two constants.

## A real example
Near Earth's surface a falling body has constant acceleration of about $-32$ feet per second squared. Antidifferentiating once gives $v(t)=-32t+v_0$; again gives $s(t)=-16t^2+v_0t+s_0$. Galileo discovered from experiment that distance fallen grows with the square of time; calculus derives his law in two lines from the single fact of constant acceleration.`
  },
  {
    number: "3.2", title: "Area and Riemann sums", blurb: "Approximating area by rectangles.",
    body: `# Area and Riemann sums

Finding the area under a curve is the second founding problem of calculus. The strategy: slice the region into thin vertical strips, approximate each by a rectangle, and add.

## Riemann sums
Divide $[a,b]$ into $n$ subintervals of width $\\Delta x=(b-a)/n$ and choose a sample point $x_i^*$ in each:
$$\\sum_{i=1}^{n}f(x_i^*)\\Delta x.$$
Left endpoints, right endpoints, and midpoints give different approximations; for an increasing function, left sums underestimate and right sums overestimate.

## Sigma notation
Summation formulas make exact limits possible: $\\sum_{i=1}^{n}i=n(n+1)/2$ and $\\sum_{i=1}^{n}i^2=n(n+1)(2n+1)/6$. Using them, the right-endpoint sum for $x^2$ on $[0,1]$ is $(n+1)(2n+1)/(6n^2)$, which approaches $1/3$ as $n\\to\\infty$. The area is the limit of the sums.

## A real example
Around 250 BCE Archimedes found the area of a parabolic segment by filling it with triangles: one large triangle, then two smaller ones in the gaps, then four, and so on, each generation having one-quarter the area of the one before. Summing $1+1/4+1/16+\\cdots=4/3$, he proved the segment has exactly four-thirds the area of the first triangle—an integral computed nineteen centuries before calculus.`
  },
  {
    number: "3.3", title: "The definite integral", blurb: "The limit of Riemann sums, and what it measures.",
    body: `# The definite integral

Bernhard Riemann gave the general definition in 1854. The definite integral of $f$ from $a$ to $b$ is the limit of Riemann sums as the subintervals shrink.

## Definition and interpretation
$$\\int_a^b f(x)\\,dx=\\lim_{n\\to\\infty}\\sum_{i=1}^{n}f(x_i^*)\\Delta x.$$
It measures net signed area: area above the axis counts positive, area below negative. Every continuous function on $[a,b]$ is integrable.

## Properties
- The integral is linear: constants factor out, and the integral of a sum is the sum of the integrals.
- $\\int_a^b f+\\int_b^c f=\\int_a^c f$, and reversing the limits changes the sign.
- The average value of $f$ on $[a,b]$ is $\\frac1{b-a}\\int_a^b f(x)\\,dx$.

The integral of a rate of change is the net change: integrating velocity gives displacement, not total distance traveled.

## A real example
A household electric meter is an integrating machine. Power drawn, $P(t)$, fluctuates second by second as appliances switch on and off; the bill charges for energy, $E=\\int P(t)\\,dt$, measured in kilowatt-hours. A 1,500-watt heater running for two hours contributes $1.5\\times2=3$ kilowatt-hours—the area of a rectangle under the power graph.`
  },
  {
    number: "3.4", title: "The fundamental theorem of calculus", blurb: "Differentiation and integration are inverse processes.",
    body: `# The fundamental theorem of calculus

Riemann sums compute integrals slowly. The fundamental theorem of calculus connects the two halves of the subject and turns integration into antidifferentiation.

## Part 1
If $f$ is continuous, the accumulation function has $f$ as its derivative:
$$\\frac{d}{dx}\\int_a^x f(t)\\,dt=f(x).$$
The rate at which area accumulates under a curve equals the height of the curve. In particular, every continuous function has an antiderivative.

## Part 2
If $F$ is any antiderivative of $f$ on $[a,b]$, then
$$\\int_a^b f(x)\\,dx=F(b)-F(a).$$
The area under $x^2$ from 0 to 1 is $1^3/3-0=1/3$ at once, with no limits of sums.

## A real example
Isaac Barrow, Newton's teacher at Cambridge, proved a geometric version of the theorem in the 1660s. But Newton and Leibniz each recognized it as a general computational method, and that recognition is what made calculus a calculus. Areas that had required Archimedes' ingenuity—one clever argument per curve—became routine: find an antiderivative and subtract.`
  },
  {
    number: "3.5", title: "Substitution", blurb: "The chain rule run backwards.",
    body: `# Substitution

Many integrands are the derivative of a composition, $f(g(x))g'(x)$. Substitution recognizes the pattern and simplifies it by renaming the inner function.

## The rule
$$\\int f(g(x))g'(x)\\,dx=\\int f(u)\\,du,\\qquad u=g(x).$$
Choose $u$ as an inner function whose derivative appears (up to a constant) as a factor. Thus $\\int 2x\\cos(x^2)\\,dx$ becomes $\\int\\cos u\\,du=\\sin(x^2)+C$.

## Definite integrals
For a definite integral, change the limits along with the variable:
$$\\int_a^b f(g(x))g'(x)\\,dx=\\int_{g(a)}^{g(b)}f(u)\\,du.$$
Then there is no need to return to $x$. Substitution also yields $\\int\\tan x\\,dx=-\\ln|\\cos x|+C$, with $u=\\cos x$.

## A real example
The Mercator map, published in 1569, spaces lines of latitude so that compass bearings appear as straight lines; the spacing at latitude $\\phi$ is the integral of $\\sec\\phi$. Edward Wright tabulated it in 1599 by adding up secants numerically. Around 1645 Henry Bond noticed the table matched $\\ln\\tan(\\pi/4+\\phi/2)$, and calculus later confirmed it: multiplying $\\sec\\phi$ by $(\\sec\\phi+\\tan\\phi)/(\\sec\\phi+\\tan\\phi)$ sets up a substitution.`
  },
  {
    number: "3.6", title: "Integration by parts", blurb: "The product rule run backwards.",
    body: `# Integration by parts

Integrating $(uv)'=u'v+uv'$ and rearranging gives the second major technique, for integrands that are products of unlike functions.

## The formula
$$\\int u\\,dv=uv-\\int v\\,du.$$
Choose $u$ to become simpler when differentiated and $dv$ to be easy to integrate. For $\\int xe^x\\,dx$, take $u=x$ and $dv=e^x\\,dx$: the result is $xe^x-e^x+C$.

## Patterns
- Polynomial times exponential or trigonometric: let $u$ be the polynomial and repeat as needed.
- Logarithms and inverse trigonometric functions: let $u$ be that function, $dv=dx$—this gives $\\int\\ln x\\,dx=x\\ln x-x+C$.
- $e^x\\sin x$: two applications return the original integral, which is then solved for algebraically.

## A real example
Integration by parts gives the Laplace transform its central property: the transform of a derivative $f'$ equals $s$ times the transform of $f$, minus $f(0)$. This turns linear differential equations into algebraic ones. Electrical and control engineers use it daily to analyze circuits, feedback systems, and autopilots—each application a disguised integration by parts.`
  },
  {
    number: "3.7", title: "Numerical integration", blurb: "Computing integrals when no antiderivative can be found.",
    body: `# Numerical integration

Many integrals cannot be done by formula. Joseph Liouville proved in the 1830s that $e^{-x^2}$—the bell curve—has no elementary antiderivative, yet its integrals are needed everywhere in statistics. They are computed numerically.

## The trapezoidal rule
Replace the curve on each subinterval by a straight line:
$$T_n=\\frac{\\Delta x}{2}[f(x_0)+2f(x_1)+\\cdots+2f(x_{n-1})+f(x_n)].$$
The error shrinks in proportion to $1/n^2$: doubling $n$ cuts it by about a factor of four.

## Simpson's rule
Replace the curve on each pair of subintervals by a parabola ($n$ even):
$$S_n=\\frac{\\Delta x}{3}[f(x_0)+4f(x_1)+2f(x_2)+\\cdots+4f(x_{n-1})+f(x_n)].$$
Its error shrinks in proportion to $1/n^4$, so doubling $n$ cuts it by about sixteen. Simpson's rule is exact for cubics.

## A real example
Naval architects compute the areas and volumes of ship hulls from tables of offsets—widths measured at evenly spaced stations along the hull. Simpson's rules have been the standard tool for this for centuries: applied to the offsets they give the waterplane area, the underwater volume, and hence the displacement and stability of a ship before it is built.`
  },
  {
    number: "4.1", title: "Area between curves", blurb: "Integrating the gap between two functions.",
    body: `# Area between curves

If $f(x)\\ge g(x)$ on $[a,b]$, the area of the region between them is the integral of the vertical gap—top minus bottom.

## The formula
$$A=\\int_a^b[f(x)-g(x)]\\,dx.$$
The limits are usually the $x$-coordinates where the curves intersect, found by solving $f(x)=g(x)$. If the curves cross inside the interval, split the integral where they cross and integrate $|f-g|$.

## Integrating in y
When a region is bounded on the left and right by curves $x=f(y)$ and $x=g(y)$, slice horizontally instead:
$$A=\\int_c^d[\\text{right}-\\text{left}]\\,dy.$$
Choosing the direction of slicing that avoids splitting the region often turns two integrals into one.

## A real example
Economists measure income inequality with the Gini coefficient. The Lorenz curve $L(x)$ gives the share of total income earned by the poorest fraction $x$ of the population; perfect equality is the line $y=x$. The Gini coefficient is the area between the two curves divided by the area under the line: $G=1-2\\int_0^1L(x)\\,dx$, ranging from 0 (equality) to 1 (one person has everything).`
  },
  {
    number: "4.2", title: "Volumes", blurb: "Slicing solids into disks, washers, and shells.",
    body: `# Volumes

A volume, like an area, is an integral: slice the solid into thin pieces whose volumes are easy, and add. If $A(x)$ is the cross-sectional area at $x$, $V=\\int_a^b A(x)\\,dx$.

## Disks and washers
Rotating $y=f(x)$ about the $x$-axis gives circular cross-sections of radius $f(x)$:
$$V=\\pi\\int_a^b[f(x)]^2\\,dx.$$
If the region has a hole, each slice is a washer with area $\\pi(R^2-r^2)$.

## Cylindrical shells
Rotating about the $y$-axis, it is often easier to use thin cylindrical shells of radius $x$ and height $f(x)$:
$$V=2\\pi\\int_a^b xf(x)\\,dx.$$
Disks slice perpendicular to the axis; shells slice parallel to it. Choose whichever gives the simpler integral.

## A real example
In 1613 Johannes Kepler noticed that Austrian wine merchants priced barrels by pushing a rod diagonally through the bung-hole and reading its length, whatever the barrel's shape. Skeptical, he wrote *Nova Stereometria Doliorum Vinariorum* (1615), computing volumes of solids of revolution by slicing them into infinitely many thin pieces—an early step toward integral calculus, prompted by a wine purchase.`
  },
  {
    number: "4.3", title: "Differential equations", blurb: "Equations whose unknown is a function.",
    body: `# Differential equations

A differential equation relates a function to its derivatives. It expresses a law of change; solving it predicts the future from the present.

## Exponential growth and decay
The simplest model says the rate of change is proportional to the amount present:
$$\\frac{dy}{dt}=ky\\implies y=y_0e^{kt}.$$
It is solved by separation of variables: $dy/y=k\\,dt$, integrate both sides, and exponentiate.

## Logistic growth and slope fields
Real populations are limited by a carrying capacity $K$:
$$\\frac{dP}{dt}=rP\\left(1-\\frac PK\\right).$$
Growth is nearly exponential when $P$ is small and slows to zero as $P$ approaches $K$, producing the S-shaped logistic curve. A slope field sketches solutions graphically when no formula is available; Euler's method follows it numerically in small steps.

## A real example
Newton's law of cooling says an object's temperature changes at a rate proportional to its difference from the surroundings: $dT/dt=-k(T-T_a)$. Its solution, $T=T_a+(T_0-T_a)e^{-kt}$, is used in forensic medicine: from two body-temperature readings taken some time apart, investigators solve for $k$ and then for the time at which the body was at a normal 98.6°F—an estimate of the time of death.`
  },
  {
    number: "4.4", title: "L'Hôpital's rule and improper integrals", blurb: "Indeterminate limits, and integrals over infinite intervals.",
    body: `# L'Hôpital's rule and improper integrals

Limits of the form $0/0$ or $\\infty/\\infty$ can be evaluated by differentiating numerator and denominator separately.

## L'Hôpital's rule
$$\\lim_{x\\to a}\\frac{f(x)}{g(x)}=\\lim_{x\\to a}\\frac{f'(x)}{g'(x)}.$$
It shows that exponentials beat polynomials, which beat logarithms: $\\lim_{x\\to\\infty}x^n/e^x=0$ and $\\lim_{x\\to\\infty}\\ln x/x=0$. Other indeterminate forms—$0\\cdot\\infty$, $\\infty-\\infty$, $1^\\infty$, $0^0$—are first rewritten as quotients. The rule is actually Johann Bernoulli's; the Marquis de L'Hôpital paid for his results and published them in the first calculus textbook in 1696.

## Improper integrals
An integral over an infinite interval, or of a function with a vertical asymptote, is defined as a limit:
$$\\int_1^\\infty f(x)\\,dx=\\lim_{t\\to\\infty}\\int_1^t f(x)\\,dx.$$
It converges if the limit is finite. The benchmark: $\\int_1^\\infty 1/x^p\\,dx$ converges exactly when $p>1$.

## A real example
In 1641 Evangelista Torricelli rotated $y=1/x$ for $x\\ge1$ about the $x$-axis. The resulting infinitely long horn—now called Gabriel's horn—has volume $\\pi\\int_1^\\infty1/x^2\\,dx=\\pi$, yet its surface area is infinite, since it exceeds $2\\pi\\int_1^\\infty1/x\\,dx$. A horn you could fill with paint but never paint was a scandal to seventeenth-century philosophers.`
  },
  {
    number: "4.5", title: "Infinite series", blurb: "Adding infinitely many numbers.",
    body: `# Infinite series

An infinite series $\\sum a_n$ is the limit of its partial sums $S_N=a_1+\\cdots+a_N$. It converges if that limit exists and diverges otherwise.

## Basic results
- Divergence test: if $a_n$ does not approach 0, the series diverges. The converse is false.
- Geometric series: $\\sum_{n=0}^\\infty ar^n=a/(1-r)$ when $|r|<1$.
- $p$-series: $\\sum_{n=1}^\\infty 1/n^p$ converges exactly when $p>1$—the integral test links it to Lecture 4.4.

$$\\sum_{n=1}^\\infty\\frac1n=\\infty.$$

## Convergence tests
The comparison tests measure a series against a known one. The ratio test examines $\\lim|a_{n+1}/a_n|$: less than 1 converges, greater than 1 diverges. The alternating series test says terms that alternate in sign and decrease to zero give a convergent series, as with $1-1/2+1/3-\\cdots=\\ln 2$.

## A real example
Around 1350 Nicole Oresme proved the harmonic series $1+1/2+1/3+\\cdots$ diverges by grouping its terms into blocks each exceeding $1/2$. The series $\\sum1/n^2$ converges, but to what resisted the best mathematicians of Europe until 1734, when Leonhard Euler showed its sum is $\\pi^2/6$—a result that made his reputation. It is still called the Basel problem.`
  },
  {
    number: "4.6", title: "Power series", blurb: "Infinite polynomials.",
    body: `# Power series

A power series is a series with a variable: an infinite polynomial centered at $a$.

## Radius of convergence
$$\\sum_{n=0}^\\infty c_n(x-a)^n.$$
Every power series has a radius of convergence $R$: it converges for $|x-a|<R$ and diverges for $|x-a|>R$, with the endpoints checked separately. The ratio test usually finds $R$. The model example is the geometric series $1/(1-x)=1+x+x^2+\\cdots$, with $R=1$.

## Calculus with power series
Inside its interval of convergence a power series can be differentiated and integrated term by term, like a polynomial. Integrating $1/(1+x^2)=1-x^2+x^4-\\cdots$ gives
$$\\arctan x=x-\\frac{x^3}{3}+\\frac{x^5}{5}-\\cdots.$$
Power series thus produce new functions and new representations of old ones.

## A real example
Setting $x=1$ in the arctangent series gives $\\pi/4=1-1/3+1/5-1/7+\\cdots$. Europeans credit James Gregory and Leibniz, who found it in the 1670s, but Madhava of Sangamagrama and the Kerala school in southern India had it around 1400, along with series for sine and cosine and correction terms to speed convergence—an early mastery of infinite series.`
  },
  {
    number: "4.7", title: "Taylor series", blurb: "Every smooth function as a polynomial of infinite degree.",
    body: `# Taylor series

If $f$ has a power series at $a$, its coefficients are forced by its derivatives: $c_n=f^{(n)}(a)/n!$. The resulting Taylor series is:

## The series
$$f(x)=\\sum_{n=0}^\\infty\\frac{f^{(n)}(a)}{n!}(x-a)^n.$$
Centered at 0 it is called a Maclaurin series. The essential examples:

- $e^x=1+x+x^2/2!+x^3/3!+\\cdots$, for all $x$;
- $\\sin x=x-x^3/3!+x^5/5!-\\cdots$;
- $\\cos x=1-x^2/2!+x^4/4!-\\cdots$.

## Taylor polynomials and error
Truncating after degree $n$ gives the Taylor polynomial $T_n$, the best polynomial approximation of $f$ near $a$. Taylor's inequality bounds the error by $M|x-a|^{n+1}/(n+1)!$, where $M$ bounds $|f^{(n+1)}|$. Substituting $ix$ into $e^x$ and comparing with the sine and cosine series gives Euler's formula $e^{ix}=\\cos x+i\\sin x$.

## A real example
Einstein's relativistic kinetic energy is $mc^2(1/\\sqrt{1-v^2/c^2}-1)$. Expanding in a Taylor series in $v/c$ gives $\\tfrac12mv^2+\\tfrac38mv^4/c^2+\\cdots$. The first term is Newton's kinetic energy; the rest are corrections too small to notice at everyday speeds. Taylor series show precisely why Newtonian physics works so well—and where it stops working.`
  },
  {
    number: "4.8", title: "Capstone synthesis", blurb: "One idea behind everything: the local determines the global.",
    body: `# Capstone synthesis

Step back, and the entire course reduces to a single sentence: calculus studies change by taking limits, and the derivative and the integral are inverse operations.

## The one theorem
$$\\int_a^b f'(x)\\,dx=f(b)-f(a).$$
Everything you have learned elaborates this statement:

- Limits make instantaneous rates precise (Week 1).
- Derivatives measure local change and locate optima (Week 2).
- Integrals add up local change into global totals (Week 3).
- Differential equations and series predict and approximate from local information (Week 4).

## Where calculus goes next
Multivariable calculus extends these ideas to functions of several variables—partial derivatives, multiple integrals, and the theorems of Green, Gauss, and Stokes, which generalize the fundamental theorem. Differential equations, probability, and physics rest on everything here.

## A real example
Konstantin Tsiolkovsky derived the rocket equation in 1903. Conservation of momentum gives a differential relation: a rocket ejecting mass $dm$ at exhaust speed $v_e$ gains speed $dv=-v_e\\,dm/m$. Integrating from initial mass $m_0$ to final mass $m_f$ gives $\\Delta v=v_e\\ln(m_0/m_f)$. Rates, a differential equation, an integral, and a logarithm—the whole course—explain why rockets are mostly fuel.`
  },
];

// Each longer reading adds a topic-specific problem and a complete worked check.
const worked: Record<string, [string, string]> = {
  "1.1": ["For $s(t)=16t^2$, find average velocity from $t=2$ to $t=2+h$ and instantaneous velocity at 2.", "$[16(2+h)^2-16(2)^2]/h=64+16h$. Let $h\\to0$ to get $64$ distance units per time unit."],
  "1.2": ["Prove $\\lim_{x\\to2}(3x+1)=7$ using $\\varepsilon$–$\\delta$.", "Since $|(3x+1)-7|=3|x-2|$, choose $\\delta=\\varepsilon/3$. Then $0<|x-2|<\\delta$ makes the output error smaller than $\\varepsilon$."],
  "1.3": ["Compute $\\lim_{x\\to4}(x^2-16)/(x-4)$.", "Factor the numerator as $(x-4)(x+4)$; for $x\\ne4$, cancel $x-4$. The limit is $4+4=8$, even though the original quotient is undefined at 4."],
  "1.4": ["Choose $c$ so that $f(x)=(x^2-4)/(x-2)$ for $x\\ne2$ and $f(2)=c$ is continuous.", "For $x\\ne2$, $f(x)=x+2$; its limit at 2 is 4. Set $c=4$, ensuring value and limit agree."],
  "1.5": ["Find the derivative of $f(x)=x^2$ directly from its definition.", "$[f(x+h)-f(x)]/h=[(x+h)^2-x^2]/h=2x+h$. Taking $h\\to0$ gives $f'(x)=2x$."],
  "1.6": ["Differentiate $x^2(x+1)$ using the product rule.", "$2x(x+1)+x^2(1)=3x^2+2x$. Expanding first to $x^3+x^2$ and differentiating checks the result."],
  "1.7": ["Differentiate $3\\sin x+2e^x$.", "Apply the sum and constant-multiple rules: the derivative is $3\\cos x+2e^x$ (with $x$ in radians)."],
  "2.1": ["Differentiate $\\sin^3(2x)$.", "Write it as $[\\sin(2x)]^3$. Differentiate the cube, then sine, then $2x$: $3\\sin^2(2x)\\cos(2x)\\cdot2=6\\sin^2(2x)\\cos(2x)$."],
  "2.2": ["Find the slope of $x^2+y^2=25$ at $(3,4)$.", "Differentiate implicitly: $2x+2yy'=0$, so $y'=-x/y=-3/4$ at $(3,4)$."],
  "2.3": ["A 10-foot ladder slides with its foot 6 feet from the wall and moving away at 2 feet per second. How fast does its top fall?", "$x^2+y^2=100$ gives $y=8$ at that instant. $2xx'+2yy'=0$, so $y'=-(6/8)(2)=-1.5$ feet per second."],
  "2.4": ["Use Newton's method on $f(x)=x^2-2$ starting at $x_0=1.5$.", "$f'(x)=2x$, so $x_1=1.5-(1.5^2-2)/(2\\cdot1.5)=17/12\\approx1.4167$, closer to $\\sqrt2$."],
  "2.5": ["Find the absolute extrema of $f(x)=x^2-2x$ on $[0,3]$.", "$f'(x)=2x-2=0$ at $x=1$. Check $f(0)=0$, $f(1)=-1$, $f(3)=3$: the minimum is $-1$ and maximum is $3$."],
  "2.6": ["Sketch the behavior of $f(x)=x^3-3x$ using derivatives.", "$f'=3x^2-3$ changes sign at $-1$ and $1$: local maximum $f(-1)=2$, local minimum $f(1)=-2$. $f''=6x$ changes sign at 0, giving an inflection point."],
  "2.7": ["Find the largest area of a rectangle with perimeter 20.", "Let width be $x$, length $10-x$. $A=x(10-x)$; $A'=10-2x=0$ at $x=5$, and $A''=-2<0$. The square's maximum area is 25."],
  "3.1": ["Given acceleration $a(t)=6t$ and initial velocity $v(0)=4$, find velocity.", "Antidifferentiate: $v(t)=3t^2+C$. Apply $v(0)=4$ to find $C=4$, so $v(t)=3t^2+4$."],
  "3.2": ["Find the right Riemann sum for $f(x)=x$ on $[0,2]$ with $n$ equal strips.", "$\\Delta x=2/n$, right endpoints $2i/n$. Thus $\\sum_{i=1}^n(2i/n)(2/n)=4n(n+1)/(2n^2)=2(n+1)/n\\to2$."],
  "3.3": ["Interpret $\\int_0^3(2t-1)\\,dt$ as signed area.", "The negative triangle from 0 to $1/2$ has area $-1/4$; the positive triangle from $1/2$ to 3 has area $25/4$. Net area is $6$."],
  "3.4": ["Compute $\\int_0^2 3x^2\\,dx$ via the fundamental theorem.", "An antiderivative is $F(x)=x^3$. Therefore $F(2)-F(0)=8$; differentiating $F$ recovers the integrand."],
  "3.5": ["Compute $\\int_0^1 2x e^{x^2}\\,dx$ by substitution.", "Let $u=x^2$, $du=2x\\,dx$; the bounds become 0 and 1. Thus $\\int_0^1e^u\\,du=e-1$."],
  "3.6": ["Integrate $\\int x\\cos x\\,dx$ by parts.", "Take $u=x$, $dv=\\cos x\\,dx$, hence $du=dx$ and $v=\\sin x$. The answer is $x\\sin x-\\int\\sin x\\,dx=x\\sin x+\\cos x+C$."],
  "3.7": ["Approximate $\\int_0^2x^2\\,dx$ with the trapezoidal rule using two strips.", "Here $\\Delta x=1$ and values are $0,1,4$. $T_2=(1/2)(0+2\\cdot1+4)=3$; the exact integral is $8/3$, so the estimate is high."],
  "4.1": ["Find the area between $y=x$ and $y=x^2$ from 0 to 1.", "$x\\ge x^2$ on $[0,1]$, so $A=\\int_0^1(x-x^2)\\,dx=[x^2/2-x^3/3]_0^1=1/6$."],
  "4.2": ["Rotate $y=x$ for $0\\le x\\le2$ around the $x$-axis. Find the volume.", "Disk radii are $x$. $V=\\pi\\int_0^2x^2\\,dx=8\\pi/3$. This also matches the volume of a cone of radius 2 and height 2."],
  "4.3": ["Solve $dy/dt=2y$ with $y(0)=3$.", "Separate $dy/y=2dt$, integrate to get $\\ln|y|=2t+C$, and use the initial condition: $y(t)=3e^{2t}$."],
  "4.4": ["Decide whether $\\int_1^\\infty x^{-2}\\,dx$ converges.", "$\\int_1^t x^{-2}\\,dx=[-1/x]_1^t=1-1/t\\to1$. It converges, consistent with the $p$-test for $p=2>1$."],
  "4.5": ["Test $\\sum_{n=1}^\\infty 1/n^2$ and $\\sum_{n=1}^\\infty 1/n$.", "The $p$-series test gives convergence for $p=2>1$ and divergence for $p=1$. Terms approaching zero alone do not ensure convergence."],
  "4.6": ["Find the radius for $\\sum_{n=0}^\\infty x^n/2^n$.", "This is geometric with ratio $r=x/2$. It converges when $|x/2|<1$, so $R=2$; at $x=\\pm2$ the terms do not tend to zero."],
  "4.7": ["Use the degree-2 Maclaurin polynomial to approximate $e^{0.1}$.", "$e^x\\approx1+x+x^2/2$, so $e^{0.1}\\approx1+0.1+0.005=1.105$ (actual value about $1.10517$)."],
  "4.8": ["A rocket loses mass from $m_0$ to $m_f$. How do local velocity changes add up?", "Integrate $dv=-v_e\\,dm/m$: $\\Delta v=-v_e[\\ln m]_{m_0}^{m_f}=v_e\\ln(m_0/m_f)$. The integral turns infinitesimal changes into total speed gain."]
};

export function expandedLecture(number: string, body: string) {
  const example = worked[number];
  if (!example) throw new Error(`Missing worked example for lecture ${number}`);
  const medium = `${body}\n\n## Try it yourself\n${example[0]}`;
  const long = `${medium}\n\n## Worked solution\n${example[1]}`;
  return { bodyMedium: medium, bodyLong: long };
}