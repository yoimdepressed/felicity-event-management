/**
 * Custom Fuzzy Search Implementation
 * Uses Levenshtein distance algorithm for typo-tolerant matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(a, b) {
    const m = a.length;
    const n = b.length;

    // Create a 2D matrix
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    // Fill base cases
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Fill the rest of the matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],     // deletion
                    dp[i][j - 1],     // insertion
                    dp[i - 1][j - 1]  // substitution
                );
            }
        }
    }

    return dp[m][n];
}

/**
 * Calculate a normalized similarity score between two strings (0 to 1)
 * 1 = perfect match, 0 = completely different
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Similarity score
 */
function similarity(a, b) {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Check if a search term fuzzy-matches a target string
 * Supports partial matching (search term as substring or close to substring)
 * @param {string} searchTerm - The search query
 * @param {string} target - The string to search in
 * @param {number} threshold - Minimum similarity score (0 to 1), default 0.4
 * @returns {{ match: boolean, score: number }}
 */
function fuzzyMatch(searchTerm, target, threshold = 0.4) {
    const search = searchTerm.toLowerCase().trim();
    const text = target.toLowerCase().trim();

    if (!search || !text) return { match: false, score: 0 };

    // Exact substring match — highest priority
    if (text.includes(search)) {
        return { match: true, score: 1 };
    }

    // Check if search is contained-ish in text (prefix match on words)
    const words = text.split(/\s+/);
    for (const word of words) {
        if (word.startsWith(search.substring(0, Math.min(search.length, 3)))) {
            const wordSim = similarity(search, word);
            if (wordSim >= threshold) {
                return { match: true, score: wordSim + 0.1 };
            }
        }
    }

    // Full string similarity
    const fullSim = similarity(search, text);
    if (fullSim >= threshold) {
        return { match: true, score: fullSim };
    }

    // Word-level fuzzy match: compare search against each word in target
    for (const word of words) {
        const wordSim = similarity(search, word);
        if (wordSim >= threshold) {
            return { match: true, score: wordSim };
        }
    }

    // Multi-word search: split search into words and check each
    const searchWords = search.split(/\s+/);
    if (searchWords.length > 1) {
        let totalScore = 0;
        let matchedWords = 0;
        for (const sw of searchWords) {
            let bestWordScore = 0;
            for (const tw of words) {
                const s = similarity(sw, tw);
                if (s > bestWordScore) bestWordScore = s;
            }
            if (bestWordScore >= threshold) {
                matchedWords++;
                totalScore += bestWordScore;
            }
        }
        const avgScore = matchedWords > 0 ? totalScore / searchWords.length : 0;
        if (matchedWords >= Math.ceil(searchWords.length * 0.5)) {
            return { match: true, score: avgScore };
        }
    }

    return { match: false, score: 0 };
}

/**
 * Perform fuzzy search on an array of items
 * @param {Array} items - Array of objects to search
 * @param {string} searchTerm - Search query
 * @param {Array<string|Function>} keys - Array of keys (strings) or accessor functions to search in
 * @param {number} threshold - Minimum similarity score (default 0.4)
 * @returns {Array} Sorted array of matching items (best matches first)
 */
export function fuzzySearchItems(items, searchTerm, keys, threshold = 0.4) {
    if (!searchTerm || !searchTerm.trim()) return items;

    const results = [];

    for (const item of items) {
        let bestScore = 0;

        for (const key of keys) {
            let value;
            if (typeof key === 'function') {
                value = key(item);
            } else {
                // Support nested keys like 'organizer.organizerName'
                value = key.split('.').reduce((obj, k) => obj?.[k], item);
            }

            if (value && typeof value === 'string') {
                const { match, score } = fuzzyMatch(searchTerm, value, threshold);
                if (match && score > bestScore) {
                    bestScore = score;
                }
            }
        }

        if (bestScore > 0) {
            results.push({ item, score: bestScore });
        }
    }

    // Sort by score descending (best matches first)
    results.sort((a, b) => b.score - a.score);

    return results.map(r => r.item);
}

export { levenshteinDistance, similarity, fuzzyMatch };
