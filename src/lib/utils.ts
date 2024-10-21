export function isIntegerString(str: string): Boolean {
  const num = parseInt(str, 10);
  return !isNaN(num) && num.toString() === str;
}

