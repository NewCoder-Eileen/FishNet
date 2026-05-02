// Mock dataset for the network visualization. Connections reference these IDs.
export const MOCK_PROFILES = [
  { id: 'p1',  name: 'Aria',  hue: 320, interests: ['ai', 'design', 'climate'],          goals: ['cofounder', 'mentor'],    connections: ['p3', 'p7', 'p11'] },
  { id: 'p2',  name: 'Ben',   hue: 220, interests: ['rust', 'systems', 'distributed'],   goals: ['internship'],             connections: ['p4', 'p9']        },
  { id: 'p3',  name: 'Chen',  hue: 280, interests: ['ai', 'climate', 'biotech'],         goals: ['cofounder', 'phd'],       connections: ['p1', 'p7']        },
  { id: 'p4',  name: 'Dami',  hue: 30,  interests: ['design', 'web3', 'art'],            goals: ['gig'],                    connections: ['p2', 'p10']       },
  { id: 'p5',  name: 'Elif',  hue: 200, interests: ['robotics', 'ai', 'embedded'],       goals: ['research'],               connections: ['p9', 'p11']       },
  { id: 'p6',  name: 'Fahad', hue: 340, interests: ['music', 'design', 'creative-code'], goals: ['collab', 'gig'],          connections: ['p10']             },
  { id: 'p7',  name: 'Gigi',  hue: 260, interests: ['climate', 'policy', 'design'],      goals: ['mentor', 'cofounder'],    connections: ['p1', 'p3', 'p12'] },
  { id: 'p8',  name: 'Hae',   hue: 190, interests: ['systems', 'ml', 'distributed'],     goals: ['internship', 'research'], connections: ['p9', 'p2']        },
  { id: 'p9',  name: 'Ines',  hue: 240, interests: ['ml', 'ai', 'rust'],                 goals: ['research', 'phd'],        connections: ['p2', 'p5', 'p8']  },
  { id: 'p10', name: 'Juno',  hue: 0,   interests: ['art', 'web3', 'music'],             goals: ['gig', 'collab'],          connections: ['p4', 'p6']        },
  { id: 'p11', name: 'Kai',   hue: 300, interests: ['biotech', 'ai', 'health'],          goals: ['phd', 'cofounder'],       connections: ['p1', 'p5']        },
  { id: 'p12', name: 'Lior',  hue: 60,  interests: ['policy', 'climate', 'design'],      goals: ['mentor', 'cofounder'],    connections: ['p7']              },
]
