function getMockFlights(origin, destination) {
  return [
    {
      airline: "IndiGo",
      price: 5480,
      departureTime: "06:35",
      arrivalTime: "08:05",
      stops: 0,
      duration: 90,
      bookingSite: "IndiGo",
      bookingUrl: `https://www.goindigo.in/flights?from=${origin}&to=${destination}`,
    },
    {
      airline: "IndiGo",
      price: 6120,
      departureTime: "11:20",
      arrivalTime: "13:10",
      stops: 0,
      duration: 110,
      bookingSite: "MakeMyTrip",
      bookingUrl: `https://www.makemytrip.com/flights?from=${origin}&to=${destination}`,
    },
    {
      airline: "IndiGo",
      price: 7320,
      departureTime: "18:10",
      arrivalTime: "21:00",
      stops: 1,
      duration: 170,
      bookingSite: "ixigo",
      bookingUrl: `https://www.ixigo.com/flights?from=${origin}&to=${destination}`,
    },
  ];
}

function getMockHotels(destination) {
  const destLower = destination.toLowerCase();

  if (destLower.includes("mumbai") || destLower.includes("bom")) {
    return [
      {
        hotelName: "Taj Mahal Palace, Mumbai",
        rating: 4.9,
        pricePerNight: 16500,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "Gym", "Breakfast", "AC"],
        bookingSite: "Booking.com",
        bookingUrl: "https://www.booking.com/hotel/in/taj-mahal-palace.html",
      },
      {
        hotelName: "Trident Bandra Kurla, Mumbai",
        rating: 4.5,
        pricePerNight: 8200,
        amenities: ["Free Wi-Fi", "Pool", "Gym", "Parking", "Restaurant", "AC"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/hotels/trident-bandra-kurla-mumbai/",
      },
      {
        hotelName: "Grand Hyatt Mumbai",
        rating: 4.4,
        pricePerNight: 9500,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "AC", "Restaurant", "Gym"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/hotels/grand-hyatt-mumbai.html",
      },
      {
        hotelName: "Hotel Sahara Star, Mumbai",
        rating: 4.1,
        pricePerNight: 6500,
        amenities: ["Free Wi-Fi", "Pool", "AC", "Restaurant", "Room service"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/hotels/sahara-star-mumbai.html",
      },
      {
        hotelName: "Ibis Mumbai Airport",
        rating: 3.8,
        pricePerNight: 3800,
        amenities: ["Free Wi-Fi", "AC", "Restaurant", "Room service"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/hotels/ibis-mumbai-airport/",
      },
    ];
  } else if (destLower.includes("nagpur") || destLower.includes("nag")) {
    return [
      {
        hotelName: "Radisson Blu Hotel Nagpur",
        rating: 4.4,
        pricePerNight: 6200,
        amenities: ["Free Wi-Fi", "Pool", "Gym", "Breakfast", "AC"],
        bookingSite: "Booking.com",
        bookingUrl: "https://www.booking.com/",
      },
      {
        hotelName: "Le Meridien Nagpur",
        rating: 4.3,
        pricePerNight: 5800,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "Restaurant", "AC"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/",
      },
      {
        hotelName: "Hotel Centre Point, Nagpur",
        rating: 4.1,
        pricePerNight: 4200,
        amenities: ["Free Wi-Fi", "Pool", "Parking", "Breakfast", "AC"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/",
      },
      {
        hotelName: "Hotel Tuli International, Nagpur",
        rating: 3.9,
        pricePerNight: 3200,
        amenities: ["Free Wi-Fi", "AC", "Restaurant", "Room service"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/",
      },
      {
        hotelName: "Hotel Hardeo, Nagpur",
        rating: 3.7,
        pricePerNight: 2400,
        amenities: ["Free Wi-Fi", "AC", "Parking", "Restaurant"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/",
      },
    ];
  } else if (destLower.includes("delhi") || destLower.includes("del")) {
    return [
      {
        hotelName: "The Taj Mahal Hotel, New Delhi",
        rating: 4.8,
        pricePerNight: 15500,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "Gym", "Breakfast"],
        bookingSite: "Booking.com",
        bookingUrl: "https://www.booking.com/",
      },
      {
        hotelName: "Hyatt Regency Delhi",
        rating: 4.4,
        pricePerNight: 7800,
        amenities: ["Free Wi-Fi", "Pool", "Gym", "Parking", "Restaurant", "Pet-friendly"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/",
      },
      {
        hotelName: "Lemon Tree Premier, Delhi Airport",
        rating: 4.1,
        pricePerNight: 5500,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "Airport shuttle", "Bar", "Pet-friendly"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/",
      },
      {
        hotelName: "Radisson Blu Plaza Delhi Airport",
        rating: 4.3,
        pricePerNight: 6800,
        amenities: ["Free Wi-Fi", "Pool", "AC", "Gym", "Restaurant"],
        bookingSite: "Booking.com",
        bookingUrl: "https://www.booking.com/",
      },
      {
        hotelName: "Ibis New Delhi Aerocity",
        rating: 3.9,
        pricePerNight: 3500,
        amenities: ["Free Wi-Fi", "AC", "Pool", "Restaurant", "Room service"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/",
      },
    ];
  }

  // Default is Goa
  return [
    {
      hotelName: `Taj Fort Aguada Resort & Spa, ${destination}`,
      rating: 4.6,
      pricePerNight: 14250,
      amenities: ["Free Wi-Fi", "Pool", "Beach access", "Spa", "Breakfast"],
      bookingSite: "Booking.com",
      bookingUrl: "https://www.booking.com/",
    },
    {
      hotelName: `Hyatt Place ${destination}`,
      rating: 4.2,
      pricePerNight: 6850,
      amenities: ["Free Wi-Fi", "Pool", "Gym", "Parking", "Restaurant"],
      bookingSite: "Goibibo",
      bookingUrl: "https://www.goibibo.com/hotels/",
    },
    {
      hotelName: `Lemon Tree Amarante Beach Resort, ${destination}`,
      rating: 4.1,
      pricePerNight: 7950,
      amenities: ["Free Wi-Fi", "Pool", "Spa", "Airport shuttle", "Bar"],
      bookingSite: "MakeMyTrip",
      bookingUrl: "https://www.makemytrip.com/hotels/",
    },
    {
      hotelName: `Hotel Mandovi, ${destination}`,
      rating: 3.7,
      pricePerNight: 2500,
      amenities: ["Free Wi-Fi", "AC", "TV", "Parking", "24-hour front desk"],
      bookingSite: "MakeMyTrip",
      bookingUrl: "https://www.makemytrip.com/hotels/",
    },
    {
      hotelName: `Alor Grande Holiday Resort, ${destination}`,
      rating: 3.8,
      pricePerNight: 3200,
      amenities: ["Free Wi-Fi", "AC", "Pool", "Restaurant", "Room service"],
      bookingSite: "Goibibo",
      bookingUrl: "https://www.goibibo.com/hotels/",
    },
  ];
}

module.exports = {
  getMockFlights,
  getMockHotels,
  // Keep these as arrays representing Goa data for legacy imports
  mockFlights: getMockFlights("Nagpur", "Goa"),
  mockHotels: getMockHotels("Goa"),
};
