const mockFlights = [
  {
    airline: "IndiGo",
    price: 5480,
    departureTime: "06:35",
    arrivalTime: "08:05",
    stops: 0,
    duration: 90,
    bookingSite: "IndiGo",
    bookingUrl: "https://www.goindigo.in/",
  },
  {
    airline: "IndiGo",
    price: 6120,
    departureTime: "11:20",
    arrivalTime: "13:10",
    stops: 0,
    duration: 110,
    bookingSite: "MakeMyTrip",
    bookingUrl: "https://www.makemytrip.com/flights/",
  },
  {
    airline: "IndiGo",
    price: 7320,
    departureTime: "18:10",
    arrivalTime: "21:00",
    stops: 1,
    duration: 170,
    bookingSite: "ixigo",
    bookingUrl: "https://www.ixigo.com/flights",
  },
];

const mockHotels = [
  {
    hotelName: "Taj Fort Aguada Resort & Spa, Goa",
    rating: 4.6,
    pricePerNight: 14250,
    amenities: ["Free Wi-Fi", "Pool", "Beach access", "Spa", "Breakfast"],
    bookingSite: "Booking.com",
    bookingUrl: "https://www.booking.com/",
  },
  {
    hotelName: "Hyatt Place Goa Candolim",
    rating: 4.2,
    pricePerNight: 6850,
    amenities: ["Free Wi-Fi", "Pool", "Gym", "Parking", "Restaurant"],
    bookingSite: "Goibibo",
    bookingUrl: "https://www.goibibo.com/hotels/",
  },
  {
    hotelName: "Lemon Tree Amarante Beach Resort, Goa",
    rating: 4.1,
    pricePerNight: 7950,
    amenities: ["Free Wi-Fi", "Pool", "Spa", "Airport shuttle", "Bar"],
    bookingSite: "MakeMyTrip",
    bookingUrl: "https://www.makemytrip.com/hotels/",
  },
];

module.exports = {
  mockFlights,
  mockHotels,
};
