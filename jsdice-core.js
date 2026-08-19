/**
 * jsdice-core.js
 * Adaptado do projeto jsdice original para uso como script global sem empacotador.
 * Implementa crypto.getRandomValues para prevenir manipulação e garantir aleatoriedade real.
 */

(function (window) {
  "use strict";

  function roll(notation) {
    const expressions = notation.split(',').map(expr => expr.trim());
    return expressions.map(expr => evaluateRollExpression(expr));
  }

  function evaluateRollExpression(notation) {
    if (!notation || notation.trim() === '') {
      return { notation, total: 0, rolls: [] };
    }

    const diceRegex = /(\d+d\d+(?:r(?:[<>=]=?)?\d+(?:L\d+)?)?(?:!(?:[<>=]=?)?\d*(?:L\d+)?)?(?:(?:kh|kl|dh|dl)\d+)?)/gi;
    const allRolls = [];
    
    const evaluatedNotation = notation.replace(diceRegex, (match) => {
      const subResult = evaluateSingleRoll(match);
      allRolls.push(...subResult.rolls);
      return subResult.total.toString();
    });

    const sanitized = evaluatedNotation.replace(/[\d\s\+\-\*\/\(\)\.]/g, '');
    if (sanitized.trim().length > 0) {
      throw new Error(`Invalid mathematical expression after dice substitution: "${notation}"`);
    }

    function safeEvaluate(expr) {
      let str = expr.replace(/\s+/g, '');

      function compute(s) {
        while (s.includes('(')) {
          s = s.replace(/\(([^\(\)]+)\)/g, (match, inner) => compute(inner));
        }

        const mulDivRegex = /(-?\d+(?:\.\d+)?)([\*\/])(-?\d+(?:\.\d+)?)/;
        while (mulDivRegex.test(s)) {
          s = s.replace(mulDivRegex, (match, a, op, b) => {
            a = parseFloat(a);
            b = parseFloat(b);
            return op === '*' ? (a * b) : (a / b);
          });
        }

        s = s.replace(/--/g, '+').replace(/\+-/g, '-');
        const addSubRegex = /(-?\d+(?:\.\d+)?)([\+\-])(\d+(?:\.\d+)?)/;
        while (addSubRegex.test(s)) {
          s = s.replace(addSubRegex, (match, a, op, b) => {
            a = parseFloat(a);
            b = parseFloat(b);
            return op === '+' ? (a + b) : (a - b);
          });
        }

        return parseFloat(s);
      }

      return compute(str);
    }

    let finalTotal = 0;
    try {
      finalTotal = safeEvaluate(evaluatedNotation);
    } catch (err) {
      throw new Error(`Failed to evaluate mathematical expression: "${notation}"`);
    }

    return {
      notation: notation,
      total: finalTotal,
      rolls: allRolls
    };
  }

  function evaluateSingleRoll(notation) {
    const GLOBAL_DICE_LIMIT = 1000;
    const MAX_EXPLOSIONS_PER_DIE = 100;

    const match = notation.match(/^(\d+)d(\d+)(r(?:[<>=]=?)?\d+(L\d+)?)?(!(?:[<>=]=?)?\d*(L\d+)?)?((kh|kl|dh|dl)(\d+))?\s*([+-]\s*\d+)?(?:\*(\d+))?$/i);
    if (!match) {
      throw new Error(`Invalid dice notation: "${notation}". Expected format like "4d6r<2!>5kh3+5*2".`);
    }

    const numDice = parseInt(match[1], 10);
    const numSides = parseInt(match[2], 10);
    
    const rerollModifier = match[3];
    const explodeModifier = match[5];
    const keepDropOperator = match[8] ? match[8].toLowerCase() : undefined;
    const keepDropCount = match[9] ? parseInt(match[9], 10) : 0;
    
    const modifierString = match[10] ? match[10].replace(/\s/g, '') : null;
    const modifier = modifierString ? parseInt(modifierString, 10) : 0;

    const multiplicationFactorString = match[11];
    const multiplicationFactor = multiplicationFactorString ? parseInt(multiplicationFactorString, 10) : 1;

    if (numDice <= 0 || numSides <= 0) {
      throw new Error('Number of dice and number of sides must be positive.');
    }

    if (numDice > GLOBAL_DICE_LIMIT) {
      throw new Error(`Cannot roll more than ${GLOBAL_DICE_LIMIT} dice at once.`);
    }

    if (keepDropOperator) {
      if ((keepDropOperator === 'dl' || keepDropOperator === 'dh') && keepDropCount >= numDice) {
        throw new Error('Cannot drop all dice or more dice than were rolled.');
      }
      if ((keepDropOperator === 'kl' || keepDropOperator === 'kh') && keepDropCount > numDice) {
        throw new Error('Cannot keep more dice than were rolled.');
      }
      if ((keepDropOperator === 'kl' || keepDropOperator === 'kh') && keepDropCount === 0) {
        throw new Error('Cannot keep zero dice.');
      }
    }

    const initialRolls = [];
    
    // ANTI-FRAUD: Cryptographically secure random roll
    const performRoll = () => {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      return (buffer[0] % numSides) + 1;
    };

    let rerollCondition = null;
    let rerollsRemaining = numDice;
    if (rerollModifier) {
      const rerollMatch = rerollModifier.match(/r([<>=]=?)?(\d+)(L(\d+))?/i);
      if (!rerollMatch) throw new Error(`Invalid reroll syntax: "${rerollModifier}"`);
      const comparison = rerollMatch[1] || '=';
      const target = parseInt(rerollMatch[2], 10);
      rerollsRemaining = rerollMatch[4] ? parseInt(rerollMatch[4], 10) : numDice;
      switch (comparison) {
        case '=': rerollCondition = (roll) => roll === target; break;
        case '<': rerollCondition = (roll) => roll < target; break;
        case '>': rerollCondition = (roll) => roll > target; break;
        case '<=': rerollCondition = (roll) => roll <= target; break;
        case '>=': rerollCondition = (roll) => roll >= target; break;
      }
    }

    let explodeCondition = null;
    let explodeLimit = MAX_EXPLOSIONS_PER_DIE;
    if (explodeModifier) {
      const explodeMatch = explodeModifier.match(/!([<>=]=?)?(\d*)?(L(\d+))?/i);
      if (!explodeMatch) throw new Error(`Invalid explode syntax: "${explodeModifier}"`);
      const comparison = explodeMatch[1] || '=';
      const target = explodeMatch[2] ? parseInt(explodeMatch[2], 10) : numSides;
      explodeLimit = explodeMatch[4] ? parseInt(explodeMatch[4], 10) : MAX_EXPLOSIONS_PER_DIE;
      switch (comparison) {
        case '=': explodeCondition = (roll) => roll === target; break;
        case '<': explodeCondition = (roll) => roll < target; break;
        case '>': explodeCondition = (roll) => roll > target; break;
        case '<=': explodeCondition = (roll) => roll <= target; break;
        case '>=': explodeCondition = (roll) => roll >= target; break;
      }
    }

    for (let i = 0; i < numDice; i++) {
      let currentRoll = performRoll();
      if (rerollCondition && rerollCondition(currentRoll) && rerollsRemaining > 0) {
        currentRoll = performRoll();
        rerollsRemaining--;
      }
      initialRolls.push(currentRoll);

      if (explodeCondition) {
        let explosionsRemaining = explodeLimit;
        while (explodeCondition(currentRoll) && explosionsRemaining > 0) {
          currentRoll = performRoll();
          initialRolls.push(currentRoll);
          explosionsRemaining--;
        }
      }
    }

    let finalRolls = [...initialRolls];
    if (keepDropOperator) {
      finalRolls.sort((a, b) => a - b);
      const rollCount = finalRolls.length;

      switch (keepDropOperator) {
        case 'dl':
          finalRolls = finalRolls.slice(keepDropCount);
          break;
        case 'dh':
          finalRolls = finalRolls.slice(0, rollCount - keepDropCount);
          break;
        case 'kl':
          finalRolls = finalRolls.slice(0, keepDropCount);
          break;
        case 'kh':
          finalRolls = finalRolls.slice(rollCount - keepDropCount);
          break;
      }
    }

    const total = finalRolls.reduce((sum, roll) => sum + roll, 0);

    return {
      notation: notation,
      total: (total + modifier) * multiplicationFactor,
      rolls: finalRolls,
    };
  }

  function countSuccesses(notation, condition) {
    const conditionMatch = condition.match(/([<>=]=?)?(\d+)/);
    if (!conditionMatch) {
      throw new Error(`Invalid success condition: "${condition}"`);
    }

    const comparison = conditionMatch[1] || '=';
    const target = parseInt(conditionMatch[2], 10);

    let conditionFn;

    switch (comparison) {
      case '=': conditionFn = (roll) => roll === target; break;
      case '<': conditionFn = (roll) => roll < target; break;
      case '>': conditionFn = (roll) => roll > target; break;
      case '<=': conditionFn = (roll) => roll <= target; break;
      case '>=': conditionFn = (roll) => roll >= target; break;
      default:
        throw new Error(`Invalid comparison operator: "${comparison}"`);
    }

    const rollResults = roll(notation);

    return rollResults.map(result => {
      const successCount = result.rolls.filter(conditionFn).length;
      return {
        notation: result.notation,
        successCount: successCount,
        rolls: result.rolls,
      };
    });
  }

  // Expõe a API globalmente para ser usada pelo conteudo.js
  window.JSDice = {
    roll: roll,
    countSuccesses: countSuccesses
  };

})(window);
