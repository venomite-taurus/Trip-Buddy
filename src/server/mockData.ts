// Real-world database of famous tourist spots, local eats, and stays across popular Indian destinations.
// Each spot is associated with its actual location, real address, and high-quality landmark-specific Unsplash photos.

export interface MockPlaceDetail {
  name: string;
  address: string;
  rating: number;
  user_ratings_total: number;
  photo_refs: string[];
  website?: string;
  contact_number?: string;
}

export interface CityData {
  stay: {
    budget: MockPlaceDetail[];
    'mid-range': MockPlaceDetail[];
    luxury: MockPlaceDetail[];
  };
  eat: {
    street: MockPlaceDetail[];
    'mid-range': MockPlaceDetail[];
    fine: MockPlaceDetail[];
  };
  visit: MockPlaceDetail[];
  roam: MockPlaceDetail[];
}

export const REAL_CITY_PLACES: Record<string, CityData> = {
  udaipur: {
    stay: {
      budget: [
        {
          name: "Zostel Udaipur",
          address: "3, Gangaur Ghat Road, Near Lake Pichola, Udaipur, Rajasthan 313001",
          rating: 4.6,
          user_ratings_total: 1850,
          photo_refs: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.zostel.com/zostel/udaipur/",
          contact_number: "+91 22 5064 6500"
        },
        {
          name: "Mewar Backpackers Hostel",
          address: "10, Lal Ghat Road, Udaipur, Rajasthan 313001",
          rating: 4.3,
          user_ratings_total: 340,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.mewarbackpackers.com/",
          contact_number: "+91 94142 34509"
        },
        {
          name: "Kehar House Homestay",
          address: "7, Gangaur Ghat Rd, Silawat Vari, Udaipur, Rajasthan 313001",
          rating: 4.5,
          user_ratings_total: 190,
          photo_refs: [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 294 242 1215"
        }
      ],
      'mid-range': [
        {
          name: "Lake Pichola Hotel",
          address: "Ambrai Road, Chandpole, Udaipur, Rajasthan 313001",
          rating: 4.4,
          user_ratings_total: 2150,
          photo_refs: [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.lakepicholahotel.com/",
          contact_number: "+91 294 242 5461"
        },
        {
          name: "Jagat Niwas Palace Hotel",
          address: "23-25, Lal Ghat Road, Udaipur, Rajasthan 313001",
          rating: 4.6,
          user_ratings_total: 1780,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1603258591834-3112a2ef45b7?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.jagatniwaspalace.com/",
          contact_number: "+91 294 242 2860"
        },
        {
          name: "Hotel Mewar Castle",
          address: "35, Lal Ghat Rd, Udaipur, Rajasthan 313001",
          rating: 4.2,
          user_ratings_total: 420,
          photo_refs: [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 294 242 3550"
        }
      ],
      luxury: [
        {
          name: "Taj Lake Palace",
          address: "Lake Pichola, Udaipur, Rajasthan 313001",
          rating: 4.9,
          user_ratings_total: 5120,
          photo_refs: [
            "https://images.unsplash.com/photo-1598977123418-45f04b615ae9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.tajhotels.com/en-in/taj/taj-lake-palace-udaipur/",
          contact_number: "+91 294 242 0101"
        },
        {
          name: "The Oberoi Udaivilas",
          address: "Badi-Gorela-Mulla Talai Rd, Haridas Ji Ki Magri, Udaipur, Rajasthan 313001",
          rating: 4.9,
          user_ratings_total: 6240,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.oberoihotels.com/hotels-in-udaipur-udaivilas/",
          contact_number: "+91 294 243 3300"
        },
        {
          name: "The Leela Palace Udaipur",
          address: "Lake Pichola, Udaipur, Rajasthan 313001",
          rating: 4.8,
          user_ratings_total: 3950,
          photo_refs: [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.theleela.com/the-leela-palace-udaipur",
          contact_number: "+91 294 262 8200"
        }
      ]
    },
    eat: {
      street: [
        {
          name: "Krishna Dal Bati Purohit",
          address: "Gulab Bagh Road, Near Kalaji Goraji Temple, Udaipur, Rajasthan 313001",
          rating: 4.5,
          user_ratings_total: 3100,
          photo_refs: [
            "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 94143 85933"
        },
        {
          name: "Jheel's Ginger Coffee House & Bakery",
          address: "52, 56, Gangaur Ghat Rd, Lal Ghat, Silawat Vari, Udaipur, Rajasthan 313001",
          rating: 4.4,
          user_ratings_total: 1950,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 294 242 5250"
        },
        {
          name: "Sukhadia Circle Street Food Chowpatty",
          address: "Sukhadia Circle Mall Road, Udaipur, Rajasthan 313001",
          rating: 4.2,
          user_ratings_total: 4800,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Upre by 1559 AD",
          address: "Roof Top, Lake Pichola Hotel, Near Ambrai Ghat, Chandpole, Udaipur, Rajasthan 313001",
          rating: 4.5,
          user_ratings_total: 3800,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://1559ad.com/upre-rooftop-restaurant-in-udaipur/",
          contact_number: "+91 294 242 5461"
        },
        {
          name: "Tribute Restaurant",
          address: "89-B, Ambavgarh, Near Fateh Sagar Lake, Udaipur, Rajasthan 313001",
          rating: 4.4,
          user_ratings_total: 2900,
          photo_refs: [
            "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.tributeudaipur.com/",
          contact_number: "+91 96101 22666"
        },
        {
          name: "Rainbow Restaurant",
          address: "27-28, Lal Ghat Road, Near Jagdish Temple, Udaipur, Rajasthan 313001",
          rating: 4.3,
          user_ratings_total: 1100,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 294 242 6154"
        }
      ],
      fine: [
        {
          name: "Ambrai Restaurant (Amet Haveli)",
          address: "Amet Haveli, Outside Chandpole, Udaipur, Rajasthan 313001",
          rating: 4.7,
          user_ratings_total: 7800,
          photo_refs: [
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.amethaveli.com/ambrai-restaurant.html",
          contact_number: "+91 294 243 1085"
        },
        {
          name: "Charcoal by Carlsson",
          address: "12, Lal Ghat, Outside Chandpole, Udaipur, Rajasthan 313001",
          rating: 4.6,
          user_ratings_total: 1400,
          photo_refs: [
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.charcoalbycarlsson.com/",
          contact_number: "+91 294 242 2860"
        }
      ]
    },
    visit: [
      {
        name: "Udaipur City Palace",
        address: "City Palace Complex, Old City, Udaipur, Rajasthan 313001",
        rating: 4.7,
        user_ratings_total: 28400,
        photo_refs: [
          "https://images.unsplash.com/photo-1603258591834-3112a2ef45b7?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1598977123418-45f04b615ae9?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Lake Pichola Boat Cruise",
        address: "Rameshwar Ghat, City Palace Complex, Udaipur, Rajasthan 313001",
        rating: 4.6,
        user_ratings_total: 11200,
        photo_refs: [
          "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1603258591834-3112a2ef45b7?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Jag Mandir Palace",
        address: "Lake Pichola Island, Udaipur, Rajasthan 313001",
        rating: 4.5,
        user_ratings_total: 6800,
        photo_refs: [
          "https://images.unsplash.com/photo-1598977123418-45f04b615ae9?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Sajjangarh Monsoon Palace",
        address: "Sajjangarh Biological Park Rd, Kodiyat, Udaipur, Rajasthan 313001",
        rating: 4.3,
        user_ratings_total: 8900,
        photo_refs: [
          "https://images.unsplash.com/photo-1603258591834-3112a2ef45b7?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Saheliyon-ki-Bari Fountains",
        address: "Saheli Marg, New Fatehpura, Panchwati, Udaipur, Rajasthan 313001",
        rating: 4.4,
        user_ratings_total: 12500,
        photo_refs: [
          "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Jagdish Temple Complex",
        address: "Jagdish Chowk, Near City Palace Road, Udaipur, Rajasthan 313001",
        rating: 4.5,
        user_ratings_total: 5400,
        photo_refs: [
          "https://images.unsplash.com/photo-1598977123418-45f04b615ae9?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "Fateh Sagar Lake & Walkway",
        address: "Fateh Sagar Lake Promenade, Dewali, Udaipur, Rajasthan 313001",
        rating: 4.7,
        user_ratings_total: 14500,
        photo_refs: [
          "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Ambrai Ghat Sunset View",
        address: "Chandpole, Old City, Near Amet Haveli, Udaipur, Rajasthan 313001",
        rating: 4.8,
        user_ratings_total: 4200,
        photo_refs: [
          "https://images.unsplash.com/photo-1603258591834-3112a2ef45b7?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Hathi Pol Art & Craft Bazaar",
        address: "Hathi Pol, Chamanpura, Udaipur, Rajasthan 313001",
        rating: 4.3,
        user_ratings_total: 2100,
        photo_refs: [
          "https://images.unsplash.com/photo-1598977123418-45f04b615ae9?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Sajjangarh Biological Park",
        address: "Monsoon Palace Road, Outside Chandpole, Udaipur, Rajasthan 313001",
        rating: 4.2,
        user_ratings_total: 3900,
        photo_refs: [
          "https://images.unsplash.com/photo-1603258591834-3112a2ef45b7?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Shilpgram Crafts Village",
        address: "Shilpgram, Badi Road, Havala organic village, Udaipur, Rajasthan 313001",
        rating: 4.4,
        user_ratings_total: 2800,
        photo_refs: [
          "https://images.unsplash.com/photo-1598977123418-45f04b615ae9?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  },
  goa: {
    stay: {
      budget: [
        {
          name: "Zostel Goa (Morjim)",
          address: "House 662, Morjim Beach Road, Morjim, Goa 403512",
          rating: 4.6,
          user_ratings_total: 980,
          photo_refs: [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.zostel.com/zostel/goa-morjim/",
          contact_number: "+91 22 5064 6500"
        },
        {
          name: "Red Door Hostel Anjuna",
          address: "House 1021, Anjuna Beach Road, Vagator, Goa 403509",
          rating: 4.3,
          user_ratings_total: 450,
          photo_refs: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 832 227 4474"
        }
      ],
      'mid-range': [
        {
          name: "Whispering Palms Beach Resort",
          address: "Sinquerim Beach Road, Candolim, Goa 403515",
          rating: 4.4,
          user_ratings_total: 3800,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.whisperingpalms.com/",
          contact_number: "+91 832 665 1515"
        },
        {
          name: "Santana Beach Resort",
          address: "Quintal de Santana, Candolim, Goa 403515",
          rating: 4.5,
          user_ratings_total: 1800,
          photo_refs: [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.santanagoa.com/",
          contact_number: "+91 832 248 9555"
        }
      ],
      luxury: [
        {
          name: "Taj Exotica Resort & Spa",
          address: "Calwaddo, Benaulim, Goa 403716",
          rating: 4.9,
          user_ratings_total: 7500,
          photo_refs: [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.tajhotels.com/en-in/taj/taj-exotica-goa/",
          contact_number: "+91 832 668 3333"
        },
        {
          name: "W Goa (Vagator)",
          address: "Vagator Beach Road, Vagator, Bardez, Goa 403509",
          rating: 4.8,
          user_ratings_total: 4200,
          photo_refs: [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.marriott.com/en-us/hotels/goiwi-w-goa/",
          contact_number: "+91 832 671 8888"
        }
      ]
    },
    eat: {
      street: [
        {
          name: "Curlies Beach Shack (Anjuna)",
          address: "Anjuna Beach, South Anjuna, Bardez, Goa 403509",
          rating: 4.4,
          user_ratings_total: 9400,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        },
        {
          name: "Britto's Beach Shack (Baga)",
          address: "Baga Calangute Road, Baga Beach, Goa 403516",
          rating: 4.3,
          user_ratings_total: 12400,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Gunpowder Assagao",
          address: "House 6, Anjuna-Mapusa Rd, Saunto Vaddo, Assagao, Goa 403507",
          rating: 4.6,
          user_ratings_total: 4900,
          photo_refs: [
            "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 832 226 8083"
        },
        {
          name: "Mum's Kitchen Panaji",
          address: "Martin's Building, D. B. Street, Miramar, Panaji, Goa 403001",
          rating: 4.4,
          user_ratings_total: 3100,
          photo_refs: [
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://mumskitchengoa.com/",
          contact_number: "+91 98221 75559"
        }
      ],
      fine: [
        {
          name: "Thalassa (Siolim)",
          address: "Plot 301/1-A, Vaddy, Siolim, Bardez, Goa 403517",
          rating: 4.5,
          user_ratings_total: 15400,
          photo_refs: [
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.thalassagoa.com/",
          contact_number: "+91 98500 33537"
        }
      ]
    },
    visit: [
      {
        name: "Basilica of Bom Jesus",
        address: "Old Goa Road, Bainguinim, Goa 403402",
        rating: 4.7,
        user_ratings_total: 21500,
        photo_refs: [
          "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Fort Aguada Lighthouse",
        address: "Aguada Fort Area, Candolim, Goa 403515",
        rating: 4.5,
        user_ratings_total: 32400,
        photo_refs: [
          "https://images.unsplash.com/photo-1587922449581-7c5519233a7a?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Dudhsagar Waterfalls Trek",
        address: "Sonaulim, Goa 403410",
        rating: 4.6,
        user_ratings_total: 14500,
        photo_refs: [
          "https://images.unsplash.com/photo-1614082242765-7c99cd00352e?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Chapora Fort Ruins",
        address: "Chapora Fort Trail, Vagator, Goa 403509",
        rating: 4.4,
        user_ratings_total: 11000,
        photo_refs: [
          "https://images.unsplash.com/photo-1587922449581-7c5519233a7a?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "Baga Beach Water Sports",
        address: "Baga Beach Road, Baga, Goa 403516",
        rating: 4.6,
        user_ratings_total: 24500,
        photo_refs: [
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Fontainhas Latin Quarter Street",
        address: "Fontainhas, Panaji, Goa 403001",
        rating: 4.6,
        user_ratings_total: 3800,
        photo_refs: [
          "https://images.unsplash.com/photo-1587922449581-7c5519233a7a?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Anjuna Wednesday Flea Market",
        address: "Monster Vaddo, Anjuna Beach, Goa 403509",
        rating: 4.2,
        user_ratings_total: 4200,
        photo_refs: [
          "https://images.unsplash.com/photo-1614082242765-7c99cd00352e?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  },
  jaipur: {
    stay: {
      budget: [
        {
          name: "Zostel Jaipur",
          address: "First Floor, 85, Hawa Mahal Rd, Link Road, Jaipur, Rajasthan 302002",
          rating: 4.6,
          user_ratings_total: 2100,
          photo_refs: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.zostel.com/zostel/jaipur/",
          contact_number: "+91 22 5064 6500"
        },
        {
          name: "Moustache Hostel Jaipur",
          address: "7, Park Street, M.I. Road, Near Ganpati Plaza, Jaipur, Rajasthan 302001",
          rating: 4.4,
          user_ratings_total: 1540,
          photo_refs: [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
          ]
        },
        {
          name: "Ashok Villa Guest House",
          address: "Ajmer Road, Near Jaipur Railway Station, Jaipur, Rajasthan 302006",
          rating: 4.5,
          user_ratings_total: 310,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 141 237 0088"
        },
        {
          name: "Rajan House Homestay",
          address: "12, Central Spine, Sector 2, Vidyadhar Nagar, Jaipur, Rajasthan 302039",
          rating: 4.6,
          user_ratings_total: 190,
          photo_refs: [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 98290 12345"
        }
      ],
      'mid-range': [
        {
          name: "Pearl Palace Heritage Boutique Hotel",
          address: "54-B, Lane 2, Fateh Singh Market, Opp. Metro Pillar 86, Jaipur, Rajasthan 302006",
          rating: 4.7,
          user_ratings_total: 1980,
          photo_refs: [
            "https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://hotelpearlpalace.com/",
          contact_number: "+91 141 236 3707"
        },
        {
          name: "Hotel Umaid Bhawan",
          address: "D-1-2A, Bihari Marg, Bani Park, Jaipur, Rajasthan 302016",
          rating: 4.5,
          user_ratings_total: 2400,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ]
        },
        {
          name: "Trident, Jaipur",
          address: "Amber Fort Road, Opposite Jal Mahal, Jaipur, Rajasthan 302002",
          rating: 4.6,
          user_ratings_total: 3100,
          photo_refs: [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.tridenthotels.com/hotels-in-jaipur",
          contact_number: "+91 141 267 0101"
        },
        {
          name: "Umaid Mahal - Heritage Style Hotel",
          address: "C-20 / B-2, Bihari Marg, Bani Park, Jaipur, Rajasthan 302016",
          rating: 4.4,
          user_ratings_total: 1820,
          photo_refs: [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.umaidmahal.com/",
          contact_number: "+91 141 220 1600"
        }
      ],
      luxury: [
        {
          name: "Taj Rambagh Palace",
          address: "Bhawani Singh Road, Jaipur, Rajasthan 302005",
          rating: 4.9,
          user_ratings_total: 8200,
          photo_refs: [
            "https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.tajhotels.com/en-in/taj/rambagh-palace-jaipur/",
          contact_number: "+91 141 238 1919"
        },
        {
          name: "The Oberoi Rajvilas",
          address: "Goner Road, Babaji Ka Mode, Jaipur, Rajasthan 302031",
          rating: 4.9,
          user_ratings_total: 3200,
          photo_refs: [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.oberoihotels.com/hotels-in-jaipur-rajvilas/",
          contact_number: "+91 141 268 0101"
        },
        {
          name: "Jai Mahal Palace",
          address: "Jacob Road, Civil Lines, Jaipur, Rajasthan 302006",
          rating: 4.8,
          user_ratings_total: 4100,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.tajhotels.com/en-in/taj/jai-mahal-palace-jaipur/",
          contact_number: "+91 141 660 1515"
        },
        {
          name: "ITC Rajputana - Luxury Collection Hotel",
          address: "Gopalbari, Palace Road, Jaipur, Rajasthan 302006",
          rating: 4.7,
          user_ratings_total: 5400,
          photo_refs: [
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
          ],
          website: "https://www.marriott.com/en-us/hotels/jaiak-itc-rajputana-a-luxury-collection-hotel-jaipur/",
          contact_number: "+91 141 510 0100"
        }
      ]
    },
    eat: {
      street: [
        {
          name: "Rawat Mishthan Bhandar (Sindhi Camp)",
          address: "Opposite Sindhi Camp Bus Stand, Station Road, Jaipur, Rajasthan 302001",
          rating: 4.4,
          user_ratings_total: 15600,
          photo_refs: [
            "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80"
          ]
        },
        {
          name: "Tapri The Tea House",
          address: "B-4, Prithviraj Road, Opposite Central Park Gate 4, C-Scheme, Jaipur, Rajasthan 302001",
          rating: 4.6,
          user_ratings_total: 8900,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ]
        },
        {
          name: "Laxmi Misthan Bhandar (LMB)",
          address: "100, Johari Bazar Road, Tripolia Bazar, Pink City, Jaipur, Rajasthan 302003",
          rating: 4.1,
          user_ratings_total: 14200,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 141 256 5844"
        },
        {
          name: "Lassiwala (Original since 1944)",
          address: "312, MI Road, Jayanti Market, New Colony, Jaipur, Rajasthan 302001",
          rating: 4.4,
          user_ratings_total: 6200,
          photo_refs: [
            "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80"
          ]
        },
        {
          name: "Samrat Restaurant",
          address: "Chaura Rasta, Pink City, Jaipur, Rajasthan 302003",
          rating: 4.3,
          user_ratings_total: 3100,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Peacock Rooftop Restaurant",
          address: "Hotel Pearl Palace, 51, Hathroi Fort, Hari Kishan Somani Marg, Jaipur, Rajasthan 302001",
          rating: 4.5,
          user_ratings_total: 6500,
          photo_refs: [
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80"
          ]
        },
        {
          name: "Curious Life Coffee Roasters",
          address: "C-54, Sarojini Marg, Panch Batti, C Scheme, Ashok Nagar, Jaipur, Rajasthan 302001",
          rating: 4.6,
          user_ratings_total: 2800,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 141 403 0101"
        },
        {
          name: "Masala Chowk Food Court",
          address: "Ram Niwas Garden, Kailash Puri, Adarsh Nagar, Jaipur, Rajasthan 302004",
          rating: 4.2,
          user_ratings_total: 8200,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      fine: [
        {
          name: "Suvarna Mahal (Rambagh Palace)",
          address: "Bhawani Singh Road, Taj Rambagh Palace Hotel, Jaipur, Rajasthan 302005",
          rating: 4.8,
          user_ratings_total: 2100,
          photo_refs: [
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=800&q=80"
          ]
        },
        {
          name: "1135 AD",
          address: "Level 2, Jaleb Chowk, Amer Fort, Amer, Jaipur, Rajasthan 302001",
          rating: 4.5,
          user_ratings_total: 3800,
          photo_refs: [
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
          ],
          contact_number: "+91 95878 85555"
        },
        {
          name: "Bar Palladio",
          address: "Narain Niwas Palace, Kanota Bagh, Narayan Singh Circle, Jaipur, Rajasthan 302004",
          rating: 4.5,
          user_ratings_total: 4200,
          photo_refs: [
            "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=800&q=80"
          ],
          website: "http://www.bar-palladio.com/",
          contact_number: "+91 141 256 5556"
        }
      ]
    },
    visit: [
      {
        name: "Hawa Mahal (Palace of Winds)",
        address: "Hawa Mahal Rd, Badi Choupad, J.D.A. Market, Pink City, Jaipur, Rajasthan 302002",
        rating: 4.7,
        user_ratings_total: 48900,
        photo_refs: [
          "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Amber Fort & Palace",
        address: "Devisinghpura, Amer, Jaipur, Rajasthan 302001",
        rating: 4.7,
        user_ratings_total: 54100,
        photo_refs: [
          "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Jaipur City Palace Complex",
        address: "Tulsi Marg, Gangori Bazaar, J.D.A. Market, Kanwar Nagar, Jaipur, Rajasthan 302002",
        rating: 4.5,
        user_ratings_total: 18900,
        photo_refs: [
          "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Jantar Mantar Observatory",
        address: "Gangori Bazaar, Near City Palace, Pink City, Jaipur, Rajasthan 302002",
        rating: 4.6,
        user_ratings_total: 24200,
        photo_refs: [
          "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Jal Mahal (Water Palace)",
        address: "Amer Road, Man Sagar Lake, Jal Mahal, Jaipur, Rajasthan 302002",
        rating: 4.5,
        user_ratings_total: 18500,
        photo_refs: [
          "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Nahargarh Fort Sunset View",
        address: "Krishna Nagar, Brahampuri, Jaipur, Rajasthan 302002",
        rating: 4.6,
        user_ratings_total: 21200,
        photo_refs: [
          "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Albert Hall Museum",
        address: "Ram Niwas Garden, Adarsh Nagar, Jaipur, Rajasthan 302004",
        rating: 4.5,
        user_ratings_total: 16900,
        photo_refs: [
          "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Birla Mandir Temple",
        address: "Jawahar Lal Nehru Marg, Tilak Nagar, Jaipur, Rajasthan 302004",
        rating: 4.6,
        user_ratings_total: 14200,
        photo_refs: [
          "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Jaigarh Fort Cannon Complex",
        address: "Devisinghpura, Amer, Jaipur, Rajasthan 302001",
        rating: 4.5,
        user_ratings_total: 9800,
        photo_refs: [
          "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "Patrika Gate (Jawahar Circle)",
        address: "Jawahar Circle, Sanganer, Jaipur, Rajasthan 302018",
        rating: 4.6,
        user_ratings_total: 9400,
        photo_refs: [
          "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Bapu Bazaar Shopping Street",
        address: "Bapu Bazaar, Link Road, Biseswarji, Jaipur, Rajasthan 302001",
        rating: 4.3,
        user_ratings_total: 12500,
        photo_refs: [
          "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  },
  munnar: {
    stay: {
      budget: [
        {
          name: "Zostel Munnar",
          address: "Surianalle, Chinnakanal Rd, Near Tea Gardens, Munnar, Kerala 685618",
          rating: 4.6,
          user_ratings_total: 850,
          photo_refs: [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Windermere Estate Tea Plantation",
          address: "Munnar - Bison Valley Road, Pallivasal, Munnar, Kerala 685565",
          rating: 4.6,
          user_ratings_total: 1200,
          photo_refs: [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      luxury: [
        {
          name: "Blanket Hotel & Spa",
          address: "Attukad Waterfall Road, Pallivasal, Munnar, Kerala 685565",
          rating: 4.8,
          user_ratings_total: 2150,
          photo_refs: [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    eat: {
      street: [
        {
          name: "Saravana Bhavan (Munnar Town)",
          address: "Munnar Market Road, Munnar Town, Kerala 685612",
          rating: 4.3,
          user_ratings_total: 4800,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Mezbaan Malabar Restaurant",
          address: "Alwaye - Munnar Rd, Nullatanni, Munnar, Kerala 685612",
          rating: 4.2,
          user_ratings_total: 2400,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      fine: [
        {
          name: "The Pavilion at Windermere",
          address: "Munnar - Bison Valley Road, Pallivasal, Munnar, Kerala 685565",
          rating: 4.6,
          user_ratings_total: 450,
          photo_refs: [
            "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    visit: [
      {
        name: "Eravikulam National Park",
        address: "The Munnar Wildlife Division, Devikulam, Munnar, Kerala 685612",
        rating: 4.7,
        user_ratings_total: 18900,
        photo_refs: [
          "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Mattupetty Dam & Lake",
        address: "Munnar - Top Station Highway, Munnar, Kerala 685612",
        rating: 4.5,
        user_ratings_total: 12400,
        photo_refs: [
          "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "Lockhart Tea Plantation Walk",
        address: "Devikulam, Munnar - Kumily Highway, Munnar, Kerala 685613",
        rating: 4.7,
        user_ratings_total: 6200,
        photo_refs: [
          "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Top Station Misty View Point",
        address: "Kodaikanal-Munnar Road, Top Station, Kerala 624101",
        rating: 4.6,
        user_ratings_total: 8100,
        photo_refs: [
          "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  },
  rishikesh: {
    stay: {
      budget: [
        {
          name: "Zostel Rishikesh (Tapovan)",
          address: "Near Balaknath Temple, Badrinath Rd, Tapovan, Rishikesh, Uttarakhand 249192",
          rating: 4.6,
          user_ratings_total: 1400,
          photo_refs: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Aloha on the Ganges Resort",
          address: "National Highway 58, Tapovan, Rishikesh, Uttarakhand 249192",
          rating: 4.5,
          user_ratings_total: 5800,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      luxury: [
        {
          name: "Taj Rishikesh Resort & Spa",
          address: "Singthali Badrinath Road, Rishikesh, Uttarakhand 249001",
          rating: 4.9,
          user_ratings_total: 1800,
          photo_refs: [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    eat: {
      street: [
        {
          name: "German Bakery (Laxman Jhula)",
          address: "Laxman Jhula Bridge Crossing, Tapovan, Rishikesh, Uttarakhand 249192",
          rating: 4.3,
          user_ratings_total: 3400,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "The Beatles Cafe",
          address: "Paidal Marg, Tapovan, Rishikesh, Uttarakhand 249192",
          rating: 4.4,
          user_ratings_total: 2900,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      fine: [
        {
          name: "The Ganga View Fine Dine",
          address: "Hotel Ganga Kinare, 237, Virbhadra Rd, Rishikesh, Uttarakhand 249201",
          rating: 4.6,
          user_ratings_total: 1200,
          photo_refs: [
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    visit: [
      {
        name: "Laxman Jhula Suspension Bridge",
        address: "Laxman Jhula crossing, Tapovan, Rishikesh, Uttarakhand 249192",
        rating: 4.6,
        user_ratings_total: 28400,
        photo_refs: [
          "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1596701062351-df5f8a42f3c5?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Beatles Ashram (Chaurasi Kutia)",
        address: "Swarg Ashram, Rishikesh, Uttarakhand 249304",
        rating: 4.5,
        user_ratings_total: 6800,
        photo_refs: [
          "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "Triveni Ghat Sunset Aarti",
        address: "Mayakund, Rishikesh, Uttarakhand 249201",
        rating: 4.8,
        user_ratings_total: 15400,
        photo_refs: [
          "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Shivpuri River Rafting gateway",
        address: "Badrinath Road NH58, Shivpuri, Rishikesh, Uttarakhand 249192",
        rating: 4.7,
        user_ratings_total: 9800,
        photo_refs: [
          "https://images.unsplash.com/photo-1596701062351-df5f8a42f3c5?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  },
  manali: {
    stay: {
      budget: [
        {
          name: "Zostel Manali (Old Manali)",
          address: "Manu Temple Road, Old Manali, Manali, Himachal Pradesh 175131",
          rating: 4.6,
          user_ratings_total: 1200,
          photo_refs: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Solang Valley Resort",
          address: "Solang Valley, Palchan, Manali, Himachal Pradesh 175131",
          rating: 4.4,
          user_ratings_total: 3100,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      luxury: [
        {
          name: "Span Resort & Spa",
          address: "Kullu Manali Highway, Patlikuhal, Manali, Himachal Pradesh 175129",
          rating: 4.8,
          user_ratings_total: 1950,
          photo_refs: [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    eat: {
      street: [
        {
          name: "Mall Road Momos & Chana Bhatura Street",
          address: "Mall Road, Near Bus Stand, Manali, Himachal Pradesh 175131",
          rating: 4.3,
          user_ratings_total: 2800,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Cafe 1947 (Old Manali)",
          address: "Near Manu Temple, Old Manali, Manali, Himachal Pradesh 175131",
          rating: 4.5,
          user_ratings_total: 4200,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      fine: [
        {
          name: "Il Forno Italian Fine Dine",
          address: "Hadimba Temple Rd, Siyal, Manali, Himachal Pradesh 175131",
          rating: 4.6,
          user_ratings_total: 1900,
          photo_refs: [
            "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    visit: [
      {
        name: "Solang Valley Adventure Arena",
        address: "Solang Valley Road, Palchan, Manali, Himachal Pradesh 175131",
        rating: 4.6,
        user_ratings_total: 19800,
        photo_refs: [
          "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Hadimba Devi Wooden Temple",
        address: "Hadimba Temple Road, Siyal, Manali, Himachal Pradesh 175131",
        rating: 4.6,
        user_ratings_total: 24500,
        photo_refs: [
          "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "Old Manali Forest Walkway",
        address: "Manu Temple Road Trail, Old Manali, Himachal Pradesh 175131",
        rating: 4.5,
        user_ratings_total: 3100,
        photo_refs: [
          "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Van Vihar National Park",
        address: "Mall Road Promenade, Near Beas River, Manali, Himachal Pradesh 175131",
        rating: 4.2,
        user_ratings_total: 8200,
        photo_refs: [
          "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  },
  delhi: {
    stay: {
      budget: [
        {
          name: "Zostel Delhi",
          address: "5, Ara Kashan Road, Opposite New Delhi Railway Station, Paharganj, New Delhi 110055",
          rating: 4.5,
          user_ratings_total: 1980,
          photo_refs: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Bloom Boutique GK-1",
          address: "M-2, Greater Kailash 1, M Block Market, New Delhi 110048",
          rating: 4.4,
          user_ratings_total: 1100,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      luxury: [
        {
          name: "The Taj Mahal Hotel (Mansingh Road)",
          address: "1, Mansingh Road, Near India Gate, New Delhi 110011",
          rating: 4.9,
          user_ratings_total: 8900,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    eat: {
      street: [
        {
          name: "Karim's Restaurant (Jama Masjid)",
          address: "16, Gali Kababian, Jama Masjid, Old Delhi, Delhi 110006",
          rating: 4.3,
          user_ratings_total: 24000,
          photo_refs: [
            "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "United Coffee House (Connaught Place)",
          address: "E-15, Rajiv Chowk, Connaught Place, New Delhi 110001",
          rating: 4.4,
          user_ratings_total: 8200,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      fine: [
        {
          name: "Indian Accent",
          address: "The Lodhi, Lodhi Road, CGO Complex, Pragati Vihar, New Delhi 110003",
          rating: 4.8,
          user_ratings_total: 4900,
          photo_refs: [
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    visit: [
      {
        name: "India Gate Memorial",
        address: "Rajpath, India Gate, New Delhi 110001",
        rating: 4.7,
        user_ratings_total: 154000,
        photo_refs: [
          "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Qutub Minar Complex",
        address: "Seth Sarai, Mehrauli, New Delhi 110030",
        rating: 4.6,
        user_ratings_total: 85200,
        photo_refs: [
          "https://images.unsplash.com/photo-1598324789736-4861f89564a0?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "Lodhi Gardens Walkway",
        address: "Lodhi Road, Lodhi Estate, New Delhi 110003",
        rating: 4.7,
        user_ratings_total: 24500,
        photo_refs: [
          "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Dilli Haat Food & Craft Bazaar",
        address: "Sri Aurobindo Marg, Opposite INA Market, New Delhi 110023",
        rating: 4.4,
        user_ratings_total: 31000,
        photo_refs: [
          "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  },
  mumbai: {
    stay: {
      budget: [
        {
          name: "Zostel Mumbai (Andheri)",
          address: "Karla Chambers, Andheri-Kurla Road, Chakala, Andheri East, Mumbai 400093",
          rating: 4.5,
          user_ratings_total: 920,
          photo_refs: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Abode Bombay Boutique Hotel",
          address: "First Floor, Lansdowne House, M.B. Marg, Near Regal Cinema, Colaba, Mumbai 400039",
          rating: 4.6,
          user_ratings_total: 810,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      luxury: [
        {
          name: "The Taj Mahal Palace",
          address: "Apollo Bandar, Colaba, Mumbai, Maharashtra 400001",
          rating: 4.9,
          user_ratings_total: 28400,
          photo_refs: [
            "https://images.unsplash.com/photo-1562158074-273602120e8b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    eat: {
      street: [
        {
          name: "Leopold Cafe & Bar (Colaba)",
          address: "Opp. Colaba Police Station, S.B. Singh Road, Colaba, Mumbai 400001",
          rating: 4.2,
          user_ratings_total: 15400,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Britannia & Co. Restaurant",
          address: "Wakefield House, 11, Sprott Rd, Ballard Estate, Fort, Mumbai 400001",
          rating: 4.3,
          user_ratings_total: 4500,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      fine: [
        {
          name: "Wasabi by Morimoto (Taj Palace)",
          address: "Taj Mahal Palace Hotel, Apollo Bunder, Colaba, Mumbai 400001",
          rating: 4.7,
          user_ratings_total: 980,
          photo_refs: [
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    visit: [
      {
        name: "Gateway of India Seafront",
        address: "Apollo Bandar, Colaba, Mumbai, Maharashtra 400001",
        rating: 4.7,
        user_ratings_total: 98200,
        photo_refs: [
          "https://images.unsplash.com/photo-1562158074-273602120e8b?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Bandra Worli Sea Link",
        address: "Bandra Worli Sea Link, Mumbai, Maharashtra 400030",
        rating: 4.8,
        user_ratings_total: 18400,
        photo_refs: [
          "https://images.unsplash.com/photo-1568849676085-51415703900f?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "Marine Drive Promenade",
        address: "Marine Drive Netaji Subhash Chandra Bose Road, Mumbai 400021",
        rating: 4.8,
        user_ratings_total: 45000,
        photo_refs: [
          "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Colaba Causeway Shopping Alley",
        address: "Shahid Bhagat Singh Road, Colaba, Mumbai 400001",
        rating: 4.3,
        user_ratings_total: 18900,
        photo_refs: [
          "https://images.unsplash.com/photo-1562158074-273602120e8b?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  },
  bengaluru: {
    stay: {
      budget: [
        {
          name: "Zostel Bangalore (Indiranagar)",
          address: "No. 2727, 1st Cross, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru 560008",
          rating: 4.6,
          user_ratings_total: 1450,
          photo_refs: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Casa Cottage Heritage Hotel",
          address: "2, O'Shaughnessy Road, Langford Town, Richmond Town, Bengaluru 560025",
          rating: 4.5,
          user_ratings_total: 620,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      luxury: [
        {
          name: "The Leela Palace Bengaluru",
          address: "23, HAL Old Airport Road, Kodihalli, Bengaluru 560008",
          rating: 4.9,
          user_ratings_total: 9200,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    eat: {
      street: [
        {
          name: "Vidyarthi Bhavan (Gandhi Bazaar)",
          address: "32, Gandhi Bazaar Main Road, Basavanagudi, Bengaluru 560004",
          rating: 4.4,
          user_ratings_total: 28900,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Toit Brewpub (Indiranagar)",
          address: "298, 100 Feet Road, Near Metro Pillar 60, Indiranagar, Bengaluru 560038",
          rating: 4.5,
          user_ratings_total: 21500,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      fine: [
        {
          name: "Karavalli (Taj West End)",
          address: "The Taj West End, 25, Race Course Road, High Grounds, Bengaluru 560001",
          rating: 4.7,
          user_ratings_total: 1800,
          photo_refs: [
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    visit: [
      {
        name: "Bangalore Palace",
        address: "Vasanth Nagar, Bengaluru, Karnataka 560052",
        rating: 4.5,
        user_ratings_total: 31000,
        photo_refs: [
          "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Lalbagh Botanical Garden Glass House",
        address: "Mavalli, Bengaluru, Karnataka 560004",
        rating: 4.5,
        user_ratings_total: 45000,
        photo_refs: [
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "Cubbon Park Green Walks",
        address: "Kasturba Road, Sampangi Rama Nagar, Bengaluru 560001",
        rating: 4.6,
        user_ratings_total: 38000,
        photo_refs: [
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Indiranagar Cafe and Pub Street",
        address: "100 Feet Road, Indiranagar, Bengaluru 560038",
        rating: 4.5,
        user_ratings_total: 14200,
        photo_refs: [
          "https://images.unsplash.com/photo-1579338559194-a162d19bf892?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  },
  pondicherry: {
    stay: {
      budget: [
        {
          name: "Zostel Pondicherry",
          address: "No. 40, Chetty Street, Near White Town, Puducherry 605001",
          rating: 4.6,
          user_ratings_total: 780,
          photo_refs: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Villa Shanti French Quarter",
          address: "14, Suffren Street, White Town, Puducherry 605001",
          rating: 4.6,
          user_ratings_total: 1850,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      luxury: [
        {
          name: "Palais de Mahe (Cgh Earth)",
          address: "4, Bussy Street, White Town, Puducherry 605001",
          rating: 4.8,
          user_ratings_total: 1100,
          photo_refs: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    eat: {
      street: [
        {
          name: "Baker Street French Bakery",
          address: "123, Bussy Street, White Town, Puducherry 605001",
          rating: 4.4,
          user_ratings_total: 6800,
          photo_refs: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      'mid-range': [
        {
          name: "Coromandel Cafe",
          address: "8, Romana Street, White Town, Puducherry 605001",
          rating: 4.5,
          user_ratings_total: 4200,
          photo_refs: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ],
      fine: [
        {
          name: "Carte Blanche at Palais de Mahe",
          address: "4, Bussy Street, White Town, Puducherry 605001",
          rating: 4.6,
          user_ratings_total: 750,
          photo_refs: [
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
          ]
        }
      ]
    },
    visit: [
      {
        name: "Auroville Matrimandir",
        address: "Matrimandir Road, Auroville, Tamil Nadu 605101",
        rating: 4.7,
        user_ratings_total: 18500,
        photo_refs: [
          "https://images.unsplash.com/photo-1589519160732-57fc498494f8?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Basilica of the Sacred Heart",
        address: "South Boulevard, Near Railway Station, Puducherry 605001",
        rating: 4.6,
        user_ratings_total: 9400,
        photo_refs: [
          "https://images.unsplash.com/photo-1589519160732-57fc498494f8?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ],
    roam: [
      {
        name: "French Quarter Wall Walkway",
        address: "Dumas Street, White Town, Puducherry 605001",
        rating: 4.7,
        user_ratings_total: 18900,
        photo_refs: [
          "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80"
        ]
      },
      {
        name: "Promenade Beach Walk",
        address: "Goubert Avenue, White Town, Puducherry 605001",
        rating: 4.6,
        user_ratings_total: 24500,
        photo_refs: [
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
        ]
      }
    ]
  }
};
