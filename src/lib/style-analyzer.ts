export function analyzeUserStyle(userMessages: string[]): string {
  if (userMessages.length === 0) return "";

  const combined = userMessages.join(" ").toLowerCase();
  const style: string[] = [];

  // Language detection
  const hasArabic = /[\u0600-\u06FF]/.test(combined);
  const hasFrench = /\b(wsh|frr|frérot|mec|ouais|trop|grave|oklm|jsp|ptdr|lol|ça|je|tu|il|on|les|des)\b/.test(combined);
  const hasEnglish = /\b(bro|man|dude|ngl|lowkey|tbh|gonna|wanna|yeah|nah|lol|wtf|omg)\b/.test(combined);
  const hasDarja = /\b(ya kho|wash|rak|zdem|mlih|bzaf|drk|rani|sala|makla|wlah|walah|khoya|wahesh|hadra|ndiro|ndir)\b/.test(combined);

  // Swearing/casual detection
  const casualSwearingLevel = (() => {
    const swearCount = (combined.match(/\b(wtf|damn|shit|hell|ass|fck|wsh|putn|zkr|qhb|nbk)\b/g) || []).length;
    if (swearCount === 0) return "none";
    if (swearCount <= 2) return "light";
    return "heavy";
  })();

  // Punctuation and caps style
  const usesNoPunctuation = !combined.includes('.') && !combined.includes('!') && !combined.includes('?');
  const usesAllLower = combined === combined.toLowerCase();
  const usesEmojis = /\p{Emoji}/u.test(combined);

  // Strict language rules
  style.push(`STRICT LANGUAGE RULE: Respond ONLY in ${
    hasDarja ? "Algerian Darja" : 
    hasArabic ? "Arabic" : 
    hasFrench ? "French" : 
    "English"
  }. Do not mix in any other language unless the user did it first in their message.`);

  // Build swear instructions
  if (casualSwearingLevel === "none") {
    style.push("User is NOT swearing — be completely clean and professional, zero swearing under any circumstance");
  } else if (casualSwearingLevel === "light") {
    style.push("User swears lightly — you can match with light casual swearing only, same words they use");
  } else {
    style.push("User swears heavily — match their energy naturally");
  }

  // Build style description
  if (hasDarja) style.push("User writes in Algerian Darja — mirror their exact dialect and slang words they use");
  if (hasFrench) style.push("User uses French slang — respond with same French street style");
  if (hasEnglish && !hasDarja) style.push("User writes in casual English — match their exact slang");
  if (hasArabic && !hasDarja) style.push("User writes in Arabic — respond in Arabic");
  
  if (usesNoPunctuation) style.push("User doesn't use punctuation — don't be overly formal with punctuation");
  if (usesAllLower) style.push("User writes in all lowercase — keep your tone super casual");
  if (usesEmojis) style.push("User uses emojis — use emojis naturally in responses");

  if (style.length === 0) return "";

  return `
## DETECTED USER STYLE (adapt to this exactly):
${style.map(s => `- ${s}`).join('\n')}

IMPORTANT: The user's specific words and expressions detected: "${userMessages.slice(-3).join(' | ')}"
Mirror their vocabulary naturally — if they say "zdem" use "zdem", if they say "bro" use "bro", etc.
  `;
}
