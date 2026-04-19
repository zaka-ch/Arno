export function analyzeUserStyle(userMessages: string[]): string {
  if (userMessages.length === 0) return "";

  const combined = userMessages.join(" ").toLowerCase();
  const style: string[] = [];

  // Count characters per language to determine PRIMARY language
  const arabicChars = (combined.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = combined.replace(/\s/g, "").length || 1; // avoid div by zero
  const arabicRatio = arabicChars / totalChars;

  // Darja specific words (must match multiple to confirm)
  const darjaWords = (combined.match(/\b(ya kho|wash|bzaf|zdem|mlih|drk|rani|wlah|walah|khoya|wahesh|sala|makla|ndiro|ywali|kima|hna|nta|nti|baraka|safi)\b/g) || []).length;

  // French SPECIFIC words that dont exist in English
  const frenchSpecificWords = (combined.match(/\b(wsh|ouais|frérot|frr|ptdr|jsp|tfk|oklm|ça|je suis|tu es|c'est|qu'est|pour|avec|mais|comme|dans|sur|une|les|des|mon|ton|son|nous|vous|ils|elles|mec|gars|trop bien|grave|carrément|franchement|putain|merde|bordel)\b/g) || []).length;

  // English SPECIFIC words
  const englishSpecificWords = (combined.match(/\b(the|is|are|was|were|have|has|had|will|would|could|should|bro|man|dude|gonna|wanna|yeah|nah|ngl|tbh|lowkey|honestly|because|that|this|with|from|what|how|why|when|where|my|your|his|her|our|their)\b/g) || []).length;

  // Determine PRIMARY language
  let primaryLanguage = "english"; // default

  if (arabicRatio > 0.3 || darjaWords >= 2) {
    primaryLanguage = darjaWords >= 2 ? "darja" : "arabic";
  } else if (frenchSpecificWords > englishSpecificWords && frenchSpecificWords >= 2) {
    primaryLanguage = "french";
  } else {
    primaryLanguage = "english";
  }

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

  // Build strict language rule
  const languageRule = `
ABSOLUTE LANGUAGE RULE — THIS OVERRIDES EVERYTHING:
The user is writing in: ${primaryLanguage.toUpperCase()}
You MUST respond in ${primaryLanguage.toUpperCase()} ONLY.
${primaryLanguage === "darja" ? "Use Algerian Darja naturally mixed with English gym terms." : ""}
${primaryLanguage === "arabic" ? "Use Modern Standard Arabic or the Arabic dialect they used." : ""}
${primaryLanguage === "french" ? "Use French. If they use French slang, match it." : ""}
${primaryLanguage === "english" ? "Use English ONLY. Do not add French or Arabic words." : ""}
DO NOT switch languages mid-response.
DO NOT add words from other languages unless the user did it first.
`;

  style.push(languageRule);

  // Build swear instructions
  if (casualSwearingLevel === "none") {
    style.push("User is NOT swearing — be completely clean and professional, zero swearing under any circumstance");
  } else if (casualSwearingLevel === "light") {
    style.push("User swears lightly — you can match with light casual swearing only, same words they use");
  } else {
    style.push("User swears heavily — match their energy naturally");
  }
  
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
