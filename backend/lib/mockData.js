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
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Trident Bandra Kurla, Mumbai",
        rating: 4.5,
        pricePerNight: 8200,
        amenities: ["Free Wi-Fi", "Pool", "Gym", "Parking", "Restaurant", "AC"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/hotels/trident-bandra-kurla-mumbai/",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Grand Hyatt Mumbai",
        rating: 4.4,
        pricePerNight: 9500,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "AC", "Restaurant", "Gym"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/hotels/grand-hyatt-mumbai.html",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Hotel Sahara Star, Mumbai",
        rating: 4.1,
        pricePerNight: 6500,
        amenities: ["Free Wi-Fi", "Pool", "AC", "Restaurant", "Room service"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/hotels/sahara-star-mumbai.html",
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Ibis Mumbai Airport",
        rating: 3.8,
        pricePerNight: 3800,
        amenities: ["Free Wi-Fi", "AC", "Restaurant", "Room service"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/hotels/ibis-mumbai-airport/",
        image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80",
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
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Le Meridien Nagpur",
        rating: 4.3,
        pricePerNight: 5800,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "Restaurant", "AC"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/",
        image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Hotel Centre Point, Nagpur",
        rating: 4.1,
        pricePerNight: 4200,
        amenities: ["Free Wi-Fi", "Pool", "Parking", "Breakfast", "AC"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/",
        image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Hotel Tuli International, Nagpur",
        rating: 3.9,
        pricePerNight: 3200,
        amenities: ["Free Wi-Fi", "AC", "Restaurant", "Room service"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/",
        image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Hotel Hardeo, Nagpur",
        rating: 3.7,
        pricePerNight: 2400,
        amenities: ["Free Wi-Fi", "AC", "Parking", "Restaurant"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/",
        image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
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
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Hyatt Regency Delhi",
        rating: 4.4,
        pricePerNight: 7800,
        amenities: ["Free Wi-Fi", "Pool", "Gym", "Parking", "Restaurant", "Pet-friendly"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/",
        image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Lemon Tree Premier, Delhi Airport",
        rating: 4.1,
        pricePerNight: 5500,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "Airport shuttle", "Bar", "Pet-friendly"],
        bookingSite: "MakeMyTrip",
        bookingUrl: "https://www.makemytrip.com/",
        image: "https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Radisson Blu Plaza Delhi Airport",
        rating: 4.3,
        pricePerNight: 6800,
        amenities: ["Free Wi-Fi", "Pool", "AC", "Gym", "Restaurant"],
        bookingSite: "Booking.com",
        bookingUrl: "https://www.booking.com/",
        image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
      },
      {
        hotelName: "Ibis New Delhi Aerocity",
        rating: 3.9,
        pricePerNight: 3500,
        amenities: ["Free Wi-Fi", "AC", "Pool", "Restaurant", "Room service"],
        bookingSite: "Goibibo",
        bookingUrl: "https://www.goibibo.com/",
        image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
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
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    },
    {
      hotelName: `Hyatt Place ${destination}`,
      rating: 4.2,
      pricePerNight: 6850,
      amenities: ["Free Wi-Fi", "Pool", "Gym", "Parking", "Restaurant"],
      bookingSite: "Goibibo",
      bookingUrl: "https://www.goibibo.com/hotels/",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    },
    {
      hotelName: `Lemon Tree Amarante Beach Resort, ${destination}`,
      rating: 4.1,
      pricePerNight: 7950,
      amenities: ["Free Wi-Fi", "Pool", "Spa", "Airport shuttle", "Bar"],
      bookingSite: "MakeMyTrip",
      bookingUrl: "https://www.makemytrip.com/hotels/",
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
    },
    {
      hotelName: `Hotel Mandovi, ${destination}`,
      rating: 3.7,
      pricePerNight: 2500,
      amenities: ["Free Wi-Fi", "AC", "TV", "Parking", "24-hour front desk"],
      bookingSite: "MakeMyTrip",
      bookingUrl: "https://www.makemytrip.com/hotels/",
      image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80",
    },
    {
      hotelName: `Alor Grande Holiday Resort, ${destination}`,
      rating: 3.8,
      pricePerNight: 3200,
      amenities: ["Free Wi-Fi", "AC", "Pool", "Restaurant", "Room service"],
      bookingSite: "Goibibo",
      bookingUrl: "https://www.goibibo.com/hotels/",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
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
