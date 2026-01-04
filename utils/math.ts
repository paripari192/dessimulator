/**
 * Generates a random number following an Exponential distribution.
 * PDF: f(x) = lambda * e^(-lambda * x)
 * Mean = 1 / lambda
 * @param lambda Rate parameter (events per unit time)
 */
export const randomExponential = (lambda: number): number => {
  // Avoid log(0)
  const u = Math.random();
  return -Math.log(1 - u) / lambda;
};

/**
 * Generates a random number following a Triangular distribution.
 * @param min Minimum value (a)
 * @param max Maximum value (b)
 * @param mode Peak value (c)
 */
export const randomTriangular = (min: number, max: number, mode: number): number => {
  const u = Math.random();
  const F = (mode - min) / (max - min);

  if (u < F) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
};
