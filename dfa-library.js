// Comprehensive DFA Library - All Valid Regular Languages
const DFA_LIBRARY = {
  "basic-patterns": {
    "name": "📂 Basic Patterns",
    "dfas": [
      {
        "name": "Ends with a",
        "description": "Accepts all strings over {a, b} that end with the symbol 'a'.",
        "states": [
          { "id": "q0", "x": 100, "y": 200, "initial": true },
          { "id": "q1", "x": 280, "y": 200, "accepting": true }
        ],
        "transitions": [
          { "from": "q0", "to": "q1", "symbol": "a" },
          { "from": "q0", "to": "q0", "symbol": "b" },
          { "from": "q1", "to": "q1", "symbol": "a" },
          { "from": "q1", "to": "q0", "symbol": "b" }
        ],
        "alphabet": ["a", "b"],
        "steps": [
          "Create two states: q0 (start) and q1 (accept).",
          "From q0, transition to q1 on 'a' (we've just seen an 'a').",
          "From q0, loop on 'b' (still haven't seen a final 'a').",
          "From q1, loop on 'a' (ends with 'a').",
          "From q1, transition to q0 on 'b' (no longer ends with 'a')."
        ]
      },
      {
        "name": "Starts with a",
        "description": "Accepts strings that start with 'a'.",
        "states": [
            { "id": "q0", "x": 100, "y": 200, "initial": true },
            { "id": "q1", "x": 280, "y": 200, "accepting": true },
            { "id": "q2", "x": 460, "y": 200 }
        ],
        "transitions": [
            { "from": "q0", "to": "q1", "symbol": "a" },
            { "from": "q0", "to": "q2", "symbol": "b" },
            { "from": "q1", "to": "q1", "symbol": "a" },
            { "from": "q1", "to": "q1", "symbol": "b" },
            { "from": "q2", "to": "q2", "symbol": "a" },
            { "from": "q2", "to": "q2", "symbol": "b" }
        ],
        "alphabet": ["a", "b"],
        "steps": [
            "Create states: q0 (start), q1 (accept), and q2 (trap).",
            "From q0, if the first symbol is 'a', move to the accepting state q1.",
            "From q0, if the first symbol is 'b', move to the trap state q2.",
            "Once in q1, any subsequent characters are allowed, so loop on 'a' and 'b'.",
            "Once in the trap state q2, stay there for any input."
        ]
      },
      {
        "name": "Contains 'aa'",
        "description": "Accepts strings containing the substring 'aa'.",
        "states": [
          { "id": "q0", "x": 100, "y": 200, "initial": true },
          { "id": "q1", "x": 280, "y": 200 },
          { "id": "q2", "x": 460, "y": 200, "accepting": true }
        ],
        "transitions": [
          { "from": "q0", "to": "q1", "symbol": "a" },
          { "from": "q0", "to": "q0", "symbol": "b" },
          { "from": "q1", "to": "q2", "symbol": "a" },
          { "from": "q1", "to": "q0", "symbol": "b" },
          { "from": "q2", "to": "q2", "symbol": "a" },
          { "from": "q2", "to": "q2", "symbol": "b" }
        ],
        "alphabet": ["a", "b"],
        "steps": [
          "q0 is the start state.",
          "From q0, seeing a 'b' keeps us in q0. Seeing an 'a' moves us to q1.",
          "q1 means we have just seen one 'a'.",
          "From q1, seeing another 'a' moves us to q2, the accepting state.",
          "From q1, seeing a 'b' resets the pattern, so we go back to q0.",
          "Once in q2, we have found 'aa', so we stay in the accepting state for any character."
        ]
      },
      {
        "name": "Even number of a's",
        "description": "Accepts strings with an even number of 'a's.",
        "states": [
          { "id": "q0", "x": 100, "y": 200, "initial": true, "accepting": true },
          { "id": "q1", "x": 280, "y": 200 }
        ],
        "transitions": [
          { "from": "q0", "to": "q1", "symbol": "a" },
          { "from": "q0", "to": "q0", "symbol": "b" },
          { "from": "q1", "to": "q0", "symbol": "a" },
          { "from": "q1", "to": "q1", "symbol": "b" }
        ],
        "alphabet": ["a", "b"],
        "steps": [
          "q0 is the start and accepting state, representing an even count of 'a's (initially zero).",
          "q1 represents an odd count of 'a's.",
          "Reading a 'b' doesn't change the parity of 'a's, so we loop on the current state.",
          "Reading an 'a' flips the parity, so we transition between q0 and q1."
        ]
      }
    ]
  },
  "length-patterns": {
    "name": "📂 Length Patterns",
    "dfas": [
      {
        "name": "Even Length",
        "description": "Accepts strings with an even total length.",
        "states": [
          { "id": "q0", "x": 100, "y": 200, "initial": true, "accepting": true },
          { "id": "q1", "x": 280, "y": 200 }
        ],
        "transitions": [
          { "from": "q0", "to": "q1", "symbol": "a" },
          { "from": "q0", "to": "q1", "symbol": "b" },
          { "from": "q1", "to": "q0", "symbol": "a" },
          { "from": "q1", "to": "q0", "symbol": "b" }
        ],
        "alphabet": ["a", "b"],
        "steps": [
          "q0 represents an even length, it's the start and accept state.",
          "q1 represents an odd length.",
          "Any character read increases the length by one, flipping the parity.",
          "Therefore, any input from q0 goes to q1, and any input from q1 goes to q0."
        ]
      },
      {
        "name": "Length divisible by 3",
        "description": "Accepts strings where the length is a multiple of 3.",
        "states": [
          { "id": "q0", "x": 100, "y": 200, "initial": true, "accepting": true },
          { "id": "q1", "x": 280, "y": 200 },
          { "id": "q2", "x": 460, "y": 200 }
        ],
        "transitions": [
          { "from": "q0", "to": "q1", "symbol": "a" },
          { "from": "q0", "to": "q1", "symbol": "b" },
          { "from": "q1", "to": "q2", "symbol": "a" },
          { "from": "q1", "to": "q2", "symbol": "b" },
          { "from": "q2", "to": "q0", "symbol": "a" },
          { "from": "q2", "to": "q0", "symbol": "b" }
        ],
        "alphabet": ["a", "b"],
        "steps": [
          "Use three states to track length modulo 3: q0 (remainder 0), q1 (remainder 1), q2 (remainder 2).",
          "q0 is the start and accepting state.",
          "Each character transitions to the next state in the cycle (q0 -> q1 -> q2 -> q0)."
        ]
      }
    ]
  },
  "binary-divisibility": {
    "name": "📂 Binary Divisibility",
    "dfas": [
      {
        "name": "Binary number divisible by 2",
        "description": "Accepts binary strings that represent a number divisible by 2 (i.e., end in 0).",
        "states": [
          { "id": "q0", "x": 100, "y": 200, "initial": true, "accepting": true },
          { "id": "q1", "x": 280, "y": 200 }
        ],
        "transitions": [
          { "from": "q0", "to": "q0", "symbol": "0" },
          { "from": "q0", "to": "q1", "symbol": "1" },
          { "from": "q1", "to": "q0", "symbol": "0" },
          { "from": "q1", "to": "q1", "symbol": "1" }
        ],
        "alphabet": ["0", "1"],
        "steps": [
          "A binary number is divisible by 2 if it ends in '0'.",
          "q0 represents a number ending in '0' (or an empty string), so it's accepting.",
          "q1 represents a number ending in '1'.",
          "If in q0 and we read a '0', it still ends in '0'. If we read a '1', it now ends in '1'.",
          "If in q1 and we read a '0', it now ends in '0'. If we read a '1', it still ends in '1'."
        ]
      },
      {
        "name": "Binary number divisible by 3",
        "description": "Accepts binary strings representing a number divisible by 3.",
        "states": [
          { "id": "s0", "x": 150, "y": 200, "initial": true, "accepting": true },
          { "id": "s1", "x": 350, "y": 120 },
          { "id": "s2", "x": 350, "y": 280 }
        ],
        "transitions": [
          { "from": "s0", "to": "s0", "symbol": "0" },
          { "from": "s0", "to": "s1", "symbol": "1" },
          { "from": "s1", "to": "s2", "symbol": "0" },
          { "from": "s1", "to": "s0", "symbol": "1" },
          { "from": "s2", "to": "s1", "symbol": "0" },
          { "from": "s2", "to": "s2", "symbol": "1" }
        ],
        "alphabet": ["0", "1"],
        "steps": [
          "We track the value of the number modulo 3.",
          "s0: remainder 0. s1: remainder 1. s2: remainder 2.",
          "If current value is N, reading '0' makes it 2*N. Reading '1' makes it 2*N + 1.",
          "From s0 (rem 0): '0' -> rem(0*2)=0 (s0). '1' -> rem(0*2+1)=1 (s1).",
          "From s1 (rem 1): '0' -> rem(1*2)=2 (s2). '1' -> rem(1*2+1)=0 (s0).",
          "From s2 (rem 2): '0' -> rem(2*2)=1 (s1). '1' -> rem(2*2+1)=2 (s2)."
        ]
      }
    ]
  }
};
