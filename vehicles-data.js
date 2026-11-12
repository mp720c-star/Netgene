// ===================== RAVIN LOOKUP — VEHICLE DATABASE =====================
const vehicles = {
  "Car/Truck": {
    "Ford": [
      "F-150 1992","F-150 1993","F-150 1994","F-150 1995","F-150 1996",
      "F-150 1997","F-150 1998","F-150 1999","F-150 2000","F-150 2001",
      "Mustang 1992","Mustang 1993","Mustang 1994","Mustang 1995","Mustang 1996",
      "Explorer 1992","Explorer 1993","Explorer 1994","Explorer 1995","Explorer 1996"
    ],
    "Chevrolet": [
      "Silverado 1992","Silverado 1993","Silverado 1994","Silverado 1995","Silverado 1996",
      "Camaro 1992","Camaro 1993","Camaro 1994","Camaro 1995","Camaro 1996",
      "Tahoe 1992","Tahoe 1993","Tahoe 1994","Tahoe 1995","Tahoe 1996"
    ],
    "Toyota": [
      "Camry 1992","Camry 1993","Camry 1994","Camry 1995","Camry 1996",
      "Corolla 1992","Corolla 1993","Corolla 1994","Corolla 1995","Corolla 1996",
      "RAV4 1992","RAV4 1993","RAV4 1994","RAV4 1995","RAV4 1996"
    ],
    "Honda": [
      "Civic 1992","Civic 1993","Civic 1994","Civic 1995","Civic 1996",
      "Accord 1992","Accord 1993","Accord 1994","Accord 1995","Accord 1996",
      "CR-V 1992","CR-V 1993","CR-V 1994","CR-V 1995","CR-V 1996"
    ],
    "Nissan": [
      "Altima 1992","Altima 1993","Altima 1994","Altima 1995","Altima 1996",
      "Maxima 1992","Maxima 1993","Maxima 1994","Maxima 1995","Maxima 1996",
      "Frontier 1992","Frontier 1993","Frontier 1994","Frontier 1995","Frontier 1996"
    ],
    "Subaru": [
      "Impreza 1992","Impreza 1993","Impreza 1994","Impreza 1995","Impreza 1996",
      "Legacy 1992","Legacy 1993","Legacy 1994","Legacy 1995","Legacy 1996",
      "Outback 1995","Outback 1996","Outback 1997","Outback 1998","Outback 1999","Outback 2000","Outback 2001",
      "Forester 1998","Forester 1999","Forester 2000","Forester 2001","Forester 2002"
    ],
    "Mazda": [
      "Mazda3 2004","Mazda3 2005","Mazda3 2006","Mazda3 2007","Mazda3 2008",
      "Mazda6 2003","Mazda6 2004","Mazda6 2005","Mazda6 2006","Mazda6 2007",
      "CX-5 2013","CX-5 2014","CX-5 2015","CX-5 2016","CX-5 2017",
      "CX-9 2007","CX-9 2008","CX-9 2009","CX-9 2010","CX-9 2011"
    ],
    "Hyundai": [
      "Elantra 1992","Elantra 1993","Elantra 1994","Elantra 1995","Elantra 1996",
      "Sonata 1992","Sonata 1993","Sonata 1994","Sonata 1995","Sonata 1996",
      "Tucson 2005","Tucson 2006","Tucson 2007","Tucson 2008","Tucson 2009",
      "Santa Fe 2001","Santa Fe 2002","Santa Fe 2003","Santa Fe 2004","Santa Fe 2005"
    ],
    "Kia": [
      "Rio 2001","Rio 2002","Rio 2003","Rio 2004","Rio 2005",
      "Spectra 2000","Spectra 2001","Spectra 2002","Spectra 2003","Spectra 2004",
      "Sorento 2003","Sorento 2004","Sorento 2005","Sorento 2006","Sorento 2007",
      "Sportage 1995","Sportage 1996","Sportage 1997","Sportage 1998","Sportage 1999"
    ],
    "GMC": [
      "Sierra 1992","Sierra 1993","Sierra 1994","Sierra 1995","Sierra 1996",
      "Yukon 1992","Yukon 1993","Yukon 1994","Yukon 1995","Yukon 1996"
    ],
    "Dodge": [
      "Ram 1500 1992","Ram 1500 1993","Ram 1500 1994","Ram 1500 1995","Ram 1500 1996",
      "Charger 1992","Charger 1993","Charger 1994","Charger 1995","Charger 1996",
      "Durango 1998","Durango 1999","Durango 2000","Durango 2001","Durango 2002"
    ],
    "Jeep": [
      "Cherokee 1992","Cherokee 1993","Cherokee 1994","Cherokee 1995","Cherokee 1996",
      "Wrangler 1992","Wrangler 1993","Wrangler 1994","Wrangler 1995","Wrangler 1996"
    ],
    "Volkswagen": [
      "Golf 1992","Golf 1993","Golf 1994","Golf 1995","Golf 1996",
      "Passat 1992","Passat 1993","Passat 1994","Passat 1995","Passat 1996"
    ],
    "BMW": [
      "3 Series 1992","3 Series 1993","3 Series 1994","3 Series 1995","3 Series 1996",
      "5 Series 1992","5 Series 1993","5 Series 1994","5 Series 1995","5 Series 1996"
    ],
    "Mercedes-Benz": [
      "C-Class 1992","C-Class 1993","C-Class 1994","C-Class 1995","C-Class 1996",
      "E-Class 1992","E-Class 1993","E-Class 1994","E-Class 1995","E-Class 1996"
    ],
    "Audi": [
      "A4 1995","A4 1996","A4 1997","A4 1998","A4 1999",
      "A6 1995","A6 1996","A6 1997","A6 1998","A6 1999"
    ]
  },
  "Dirt Bike/Moto": {
    "Honda": [
      "CRF450R 2019","CRF450R 2020","CRF450R 2021","CRF450R 2022","CRF450R 2023",
      "CRF250R 2019","CRF250R 2020","CRF250R 2021","CRF250R 2022","CRF250R 2023",
      "XR650L 2018","XR650L 2019","XR650L 2020","XR650L 2021","XR650L 2022"
    ],
    "Yamaha": [
      "YZ250F 2019","YZ250F 2020","YZ250F 2021","YZ250F 2022","YZ250F 2023",
      "YZ450F 2019","YZ450F 2020","YZ450F 2021","YZ450F 2022","YZ450F 2023",
      "WR250F 2019","WR250F 2020","WR250F 2021","WR250F 2022","WR250F 2023"
    ],
    "Kawasaki": [
      "KX250 2019","KX250 2020","KX250 2021","KX250 2022","KX250 2023",
      "KX450 2019","KX450 2020","KX450 2021","KX450 2022","KX450 2023",
      "KLX300 2020","KLX300 2021","KLX300 2022","KLX300 2023"
    ],
    "KTM": [
      "250 SX-F 2019","250 SX-F 2020","250 SX-F 2021","250 SX-F 2022","250 SX-F 2023",
      "450 SX-F 2019","450 SX-F 2020","450 SX-F 2021","450 SX-F 2022","450 SX-F 2023"
    ],
    "Suzuki": [
      "RM-Z250 2019","RM-Z250 2020","RM-Z250 2021","RM-Z250 2022","RM-Z250 2023",
      "RM-Z450 2019","RM-Z450 2020","RM-Z450 2021","RM-Z450 2022","RM-Z450 2023"
    ]
  },
  "ATV/4-Wheeler": {
    "Polaris": [
      "Sportsman 450 2019","Sportsman 450 2020","Sportsman 450 2021","Sportsman 450 2022","Sportsman 450 2023",
      "Sportsman 570 2019","Sportsman 570 2020","Sportsman 570 2021","Sportsman 570 2022","Sportsman 570 2023",
      "Ranger 1000 2019","Ranger 1000 2020","Ranger 1000 2021","Ranger 1000 2022","Ranger 1000 2023"
    ],
    "Can-Am": [
      "Maverick X3 2019","Maverick X3 2020","Maverick X3 2021","Maverick X3 2022","Maverick X3 2023",
      "Outlander 570 2019","Outlander 570 2020","Outlander 570 2021","Outlander 570 2022","Outlander 570 2023",
      "Defender HD8 2019","Defender HD8 2020","Defender HD8 2021","Defender HD8 2022","Defender HD8 2023"
    ],
    "Honda": [
      "FourTrax Rancher 2019","FourTrax Rancher 2020","FourTrax Rancher 2021","FourTrax Rancher 2022","FourTrax Rancher 2023",
      "FourTrax Foreman 2019","FourTrax Foreman 2020","FourTrax Foreman 2021","FourTrax Foreman 2022","FourTrax Foreman 2023"
    ],
    "Yamaha": [
      "Grizzly 700 2019","Grizzly 700 2020","Grizzly 700 2021","Grizzly 700 2022","Grizzly 700 2023",
      "Kodiak 700 2019","Kodiak 700 2020","Kodiak 700 2021","Kodiak 700 2022","Kodiak 700 2023"
    ],
    "Kawasaki": [
      "Brute Force 750 2019","Brute Force 750 2020","Brute Force 750 2021","Brute Force 750 2022","Brute Force 750 2023",
      "Teryx 2019","Teryx 2020","Teryx 2021","Teryx 2022","Teryx 2023"
    ]
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { vehicles };
}
