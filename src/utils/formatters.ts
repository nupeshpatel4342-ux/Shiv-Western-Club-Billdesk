export const fmt = (n: number) => Number(n).toLocaleString("en-IN");

export const numToWords = (num: number) => {
  const a = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const n = Math.floor(num);
  if (n === 0) return "zero";
  const inWords = (x: number): string => {
    if (x < 20) return a[x];
    if (x < 100) return b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : "");
    if (x < 1000) return a[Math.floor(x / 100)] + " hundred" + (x % 100 ? " " + inWords(x % 100) : "");
    if (x < 100000) return inWords(Math.floor(x / 1000)) + " thousand" + (x % 1000 ? " " + inWords(x % 1000) : "");
    if (x < 10000000) return inWords(Math.floor(x / 100000)) + " lakh" + (x % 100000 ? " " + inWords(x % 100000) : "");
    return inWords(Math.floor(x / 10000000)) + " crore" + (x % 10000000 ? " " + inWords(x % 10000000) : "");
  };
  return inWords(n);
};
