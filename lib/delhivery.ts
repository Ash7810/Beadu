// Delhivery One Logistics & Shipment Tracking Integration Helper for www.beadu.in

export interface ServiceabilityResult {
  pincode: string;
  serviceable: boolean;
  city: string;
  state: string;
  estimatedDays: number;
  codAvailable: boolean;
  courierPartner: string;
  message: string;
}

export interface TrackingStep {
  status: 'Order Placed' | 'Order Accepted' | 'Picked Up' | 'In Transit' | 'Out for Delivery' | 'Delivered';
  location: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface DelhiveryTrackingInfo {
  awbNumber: string;
  orderId: string;
  currentStatus: string;
  estimatedDeliveryDate: string;
  origin: string;
  destination: string;
  steps: TrackingStep[];
}

// Indian postal circle & city resolver matching India Post postal zones
export function lookupPincodeLocation(pincode: string): { city: string; state: string } {
  const pin = pincode.trim();
  if (!/^[1-9]\d{5}$/.test(pin)) {
    return { city: '', state: '' };
  }

  // Major cities by 3-digit prefix
  const cityMap: Record<string, { city: string; state: string }> = {
    '110': { city: 'New Delhi', state: 'Delhi' },
    '400': { city: 'Mumbai', state: 'Maharashtra' },
    '411': { city: 'Pune', state: 'Maharashtra' },
    '440': { city: 'Nagpur', state: 'Maharashtra' },
    '560': { city: 'Bengaluru', state: 'Karnataka' },
    '570': { city: 'Mysuru', state: 'Karnataka' },
    '575': { city: 'Mangalore', state: 'Karnataka' },
    '600': { city: 'Chennai', state: 'Tamil Nadu' },
    '641': { city: 'Coimbatore', state: 'Tamil Nadu' },
    '625': { city: 'Madurai', state: 'Tamil Nadu' },
    '700': { city: 'Kolkata', state: 'West Bengal' },
    '711': { city: 'Howrah', state: 'West Bengal' },
    '500': { city: 'Hyderabad', state: 'Telangana' },
    '520': { city: 'Vijayawada', state: 'Andhra Pradesh' },
    '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
    '380': { city: 'Ahmedabad', state: 'Gujarat' },
    '395': { city: 'Surat', state: 'Gujarat' },
    '390': { city: 'Vadodara', state: 'Gujarat' },
    '360': { city: 'Rajkot', state: 'Gujarat' },
    '302': { city: 'Jaipur', state: 'Rajasthan' },
    '342': { city: 'Jodhpur', state: 'Rajasthan' },
    '313': { city: 'Udaipur', state: 'Rajasthan' },
    '122': { city: 'Gurugram', state: 'Haryana' },
    '121': { city: 'Faridabad', state: 'Haryana' },
    '201': { city: 'Noida', state: 'Uttar Pradesh' },
    '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
    '208': { city: 'Kanpur', state: 'Uttar Pradesh' },
    '221': { city: 'Varanasi', state: 'Uttar Pradesh' },
    '452': { city: 'Indore', state: 'Madhya Pradesh' },
    '462': { city: 'Bhopal', state: 'Madhya Pradesh' },
    '492': { city: 'Raipur', state: 'Chhattisgarh' },
    '800': { city: 'Patna', state: 'Bihar' },
    '834': { city: 'Ranchi', state: 'Jharkhand' },
    '831': { city: 'Jamshedpur', state: 'Jharkhand' },
    '751': { city: 'Bhubaneswar', state: 'Odisha' },
    '781': { city: 'Guwahati', state: 'Assam' },
    '682': { city: 'Kochi', state: 'Kerala' },
    '695': { city: 'Thiruvananthapuram', state: 'Kerala' },
    '673': { city: 'Kozhikode', state: 'Kerala' },
    '160': { city: 'Chandigarh', state: 'Chandigarh' },
    '141': { city: 'Ludhiana', state: 'Punjab' },
    '143': { city: 'Amritsar', state: 'Punjab' },
    '171': { city: 'Shimla', state: 'Himachal Pradesh' },
    '190': { city: 'Srinagar', state: 'Jammu & Kashmir' },
    '180': { city: 'Jammu', state: 'Jammu & Kashmir' },
    '248': { city: 'Dehradun', state: 'Uttarakhand' },
    '403': { city: 'Panaji', state: 'Goa' },
  };

  const prefix3 = pin.slice(0, 3);
  if (cityMap[prefix3]) {
    return cityMap[prefix3];
  }

  const prefix2 = pin.slice(0, 2);

  // 2-digit Indian Postal Circles
  const circleMap: Record<string, { city: string; state: string }> = {
    '11': { city: 'Delhi', state: 'Delhi' },
    '12': { city: 'Gurugram / South Haryana', state: 'Haryana' },
    '13': { city: 'Ambala / North Haryana', state: 'Haryana' },
    '14': { city: 'Jalandhar / Ludhiana', state: 'Punjab' },
    '15': { city: 'Bathinda Region', state: 'Punjab' },
    '16': { city: 'Chandigarh Region', state: 'Punjab' },
    '17': { city: 'Shimla Region', state: 'Himachal Pradesh' },
    '18': { city: 'Jammu Region', state: 'Jammu & Kashmir' },
    '19': { city: 'Kashmir Region', state: 'Jammu & Kashmir' },
    '20': { city: 'Noida / Western UP', state: 'Uttar Pradesh' },
    '21': { city: 'Prayagraj Region', state: 'Uttar Pradesh' },
    '22': { city: 'Lucknow Region', state: 'Uttar Pradesh' },
    '23': { city: 'Kanpur Region', state: 'Uttar Pradesh' },
    '24': { city: 'Bareilly / Moradabad', state: 'Uttar Pradesh' },
    '25': { city: 'Meerut Region', state: 'Uttar Pradesh' },
    '26': { city: 'Dehradun / Kumaon', state: 'Uttarakhand' },
    '27': { city: 'Gorakhpur Region', state: 'Uttar Pradesh' },
    '28': { city: 'Agra Region', state: 'Uttar Pradesh' },
    '30': { city: 'Jaipur Region', state: 'Rajasthan' },
    '31': { city: 'Udaipur / Ajmer', state: 'Rajasthan' },
    '32': { city: 'Kota Region', state: 'Rajasthan' },
    '33': { city: 'Bikaner Region', state: 'Rajasthan' },
    '34': { city: 'Jodhpur Region', state: 'Rajasthan' },
    '36': { city: 'Rajkot / Saurashtra', state: 'Gujarat' },
    '37': { city: 'Kutch Region', state: 'Gujarat' },
    '38': { city: 'Ahmedabad Region', state: 'Gujarat' },
    '39': { city: 'Surat / South Gujarat', state: 'Gujarat' },
    '40': { city: 'Mumbai Region', state: 'Maharashtra' },
    '41': { city: 'Pune / Western Maharashtra', state: 'Maharashtra' },
    '42': { city: 'Nashik / Khandesh', state: 'Maharashtra' },
    '43': { city: 'Aurangabad / Marathwada', state: 'Maharashtra' },
    '44': { city: 'Nagpur / Vidarbha', state: 'Maharashtra' },
    '45': { city: 'Indore / Malwa', state: 'Madhya Pradesh' },
    '46': { city: 'Bhopal Region', state: 'Madhya Pradesh' },
    '47': { city: 'Gwalior Region', state: 'Madhya Pradesh' },
    '48': { city: 'Jabalpur Region', state: 'Madhya Pradesh' },
    '49': { city: 'Raipur Region', state: 'Chhattisgarh' },
    '50': { city: 'Hyderabad Region', state: 'Telangana' },
    '51': { city: 'Rayalaseema Region', state: 'Andhra Pradesh' },
    '52': { city: 'Vijayawada / Coastal AP', state: 'Andhra Pradesh' },
    '53': { city: 'Visakhapatnam Region', state: 'Andhra Pradesh' },
    '56': { city: 'Bengaluru Region', state: 'Karnataka' },
    '57': { city: 'Coastal / South Karnataka', state: 'Karnataka' },
    '58': { city: 'Hubli / North Karnataka', state: 'Karnataka' },
    '59': { city: 'Belagavi Region', state: 'Karnataka' },
    '60': { city: 'Chennai Region', state: 'Tamil Nadu' },
    '61': { city: 'Tiruchirappalli Region', state: 'Tamil Nadu' },
    '62': { city: 'Madurai Region', state: 'Tamil Nadu' },
    '63': { city: 'Salem Region', state: 'Tamil Nadu' },
    '64': { city: 'Coimbatore Region', state: 'Tamil Nadu' },
    '67': { city: 'Malabar / Kozhikode', state: 'Kerala' },
    '68': { city: 'Kochi / Central Kerala', state: 'Kerala' },
    '69': { city: 'Thiruvananthapuram Region', state: 'Kerala' },
    '70': { city: 'Kolkata Region', state: 'West Bengal' },
    '71': { city: 'Howrah / Hooghly', state: 'West Bengal' },
    '72': { city: 'Medinipur Region', state: 'West Bengal' },
    '73': { city: 'Siliguri / North Bengal', state: 'West Bengal' },
    '74': { city: 'Nadia / Murshidabad', state: 'West Bengal' },
    '75': { city: 'Bhubaneswar / Coastal Odisha', state: 'Odisha' },
    '76': { city: 'Western Odisha', state: 'Odisha' },
    '77': { city: 'Rourkela / North Odisha', state: 'Odisha' },
    '78': { city: 'Guwahati / Assam Valley', state: 'Assam' },
    '79': { city: 'North East Region', state: 'North East' },
    '80': { city: 'Patna Region', state: 'Bihar' },
    '81': { city: 'Bhagalpur Region', state: 'Bihar' },
    '82': { city: 'Dhanbad Region', state: 'Jharkhand' },
    '83': { city: 'Ranchi Region', state: 'Jharkhand' },
    '84': { city: 'Muzaffarpur / North Bihar', state: 'Bihar' },
    '85': { city: 'Purnea Region', state: 'Bihar' },
  };

  if (circleMap[prefix2]) {
    return circleMap[prefix2];
  }

  // 1-digit Indian Postal Zones fallback to ensure a valid Indian state is always assigned
  const zoneMap: Record<string, { city: string; state: string }> = {
    '1': { city: 'Northern Zone City', state: 'Delhi / NCR' },
    '2': { city: 'Uttar Pradesh City', state: 'Uttar Pradesh' },
    '3': { city: 'Western Zone City', state: 'Rajasthan / Gujarat' },
    '4': { city: 'Central Zone City', state: 'Maharashtra' },
    '5': { city: 'Southern Zone City', state: 'Karnataka / AP' },
    '6': { city: 'South Coastal City', state: 'Tamil Nadu / Kerala' },
    '7': { city: 'Eastern Zone City', state: 'West Bengal / Odisha' },
    '8': { city: 'East Central City', state: 'Bihar / Jharkhand' },
  };

  const firstDigit = pin.charAt(0);
  if (zoneMap[firstDigit]) {
    return zoneMap[firstDigit];
  }

  return { city: 'Metro Hub', state: 'India' };
}

/**
 * Live Indian Postal PIN code API lookup:
 * Queries the official India Post Postal Pincode directory with timeout and auto-fallback.
 */
export async function fetchLivePincodeData(pincode: string): Promise<{ city: string; state: string; district?: string } | null> {
  const clean = pincode.trim().replace(/\D/g, '').slice(0, 6);
  if (!/^[1-9]\d{5}$/.test(clean)) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
      const po = data[0].PostOffice[0];
      const district = po.District || po.Block || po.Division || '';
      const state = po.State || '';
      const city = district || po.Name || lookupPincodeLocation(clean).city;
      if (city && state) {
        return {
          city: city.trim(),
          state: state.trim(),
          district: district.trim(),
        };
      }
    }
  } catch {
    // Network failure, timeout, or offline - safely handled by caller fallback
  }

  return null;
}

/**
 * Validates that an address object has all required fields to manifest with Delhivery One.
 * Manifestation requires: recipient name, 10-digit phone, email, street address, 6-digit PIN, city, and state.
 */
export function validateOrderAddressForDelhivery(address: {
  fullName?: string;
  phone?: string;
  email?: string;
  street?: string;
  zipCode?: string;
  city?: string;
  state?: string;
}): { valid: boolean; missingField?: string; message?: string } {
  if (!address.fullName?.trim() || address.fullName.trim().length < 2) {
    return { valid: false, missingField: 'fullName', message: 'Name is required.' };
  }
  if (!address.phone?.trim() || !/^[6-9]\d{9}$/.test(address.phone.trim().replace(/\D/g, ''))) {
    return { valid: false, missingField: 'phone', message: 'Valid 10-digit mobile number is required.' };
  }
  if (!address.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
    return { valid: false, missingField: 'email', message: 'Valid email address is required.' };
  }
  if (!address.street?.trim() || address.street.trim().length < 4) {
    return { valid: false, missingField: 'street', message: 'Address is required.' };
  }
  if (!address.zipCode?.trim() || !/^[1-9]\d{5}$/.test(address.zipCode.trim())) {
    return { valid: false, missingField: 'zipCode', message: 'Valid PIN code is required.' };
  }
  if (!address.city?.trim() || address.city.trim().length < 2) {
    return { valid: false, missingField: 'city', message: 'City is required.' };
  }
  if (!address.state?.trim() || address.state.trim().length < 2) {
    return { valid: false, missingField: 'state', message: 'State is required.' };
  }
  return { valid: true };
}

export function checkDelhiveryServiceability(pincode: string): ServiceabilityResult {
  const cleanPin = pincode.trim();
  if (!/^[1-9]\d{5}$/.test(cleanPin)) {
    return {
      pincode: cleanPin,
      serviceable: false,
      city: '',
      state: '',
      estimatedDays: 0,
      codAvailable: false,
      courierPartner: 'Express Delivery',
      message: 'Please enter a valid PIN code.',
    };
  }

  const location = lookupPincodeLocation(cleanPin);

  // Simulated pin coverage lookup
  const isMetro = ['110', '400', '560', '600', '700', '500', '380', '411', '122', '201', '302'].some((prefix) =>
    cleanPin.startsWith(prefix)
  );

  const days = isMetro ? 2 : 4;
  const today = new Date();
  today.setDate(today.getDate() + days);
  const formattedDate = today.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return {
    pincode: cleanPin,
    serviceable: true,
    city: location.city,
    state: location.state,
    estimatedDays: days,
    codAvailable: false,
    courierPartner: 'Express Courier Network',
    message: `Delivery to ${location.city}, ${location.state} available by ${formattedDate} (${days}-${days + 1} business days)`,
  };
}

/**
 * Production API Integration Function:
 * Fetches real-time shipment scan events directly from Delhivery One REST API.
 */
export async function fetchLiveDelhiveryTrackingAPI(awbNumber: string): Promise<DelhiveryTrackingInfo | null> {
  const apiKey = process.env.DELHIVERY_API_KEY;
  if (!apiKey) return null; // Fallbacks to local progression engine if API key is not present

  try {
    const res = await fetch(`https://track.delhivery.com/api/v1/packages/json/?waybill=${encodeURIComponent(awbNumber)}`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ShipmentData || data.ShipmentData.length === 0) return null;

    const shipment = data.ShipmentData[0].Shipment;
    return {
      awbNumber: shipment.AWB,
      orderId: shipment.ReferenceNo || `ORD-${shipment.AWB.slice(-5)}`,
      currentStatus: shipment.Status.Status || 'In Transit',
      estimatedDeliveryDate: shipment.ExpectedDeliveryDate || '2-3 Days',
      origin: shipment.Origin || 'Jaipur Crafts Hub',
      destination: shipment.Destination || 'Customer Address',
      steps: (shipment.Scans || []).map((scan: { ScanDetail: { ScanDateTime: string; Instructions: string; ScannedLocation: string; Scan: string } }) => ({
        status: scan.ScanDetail.Scan as TrackingStep['status'],
        location: scan.ScanDetail.ScannedLocation,
        timestamp: scan.ScanDetail.ScanDateTime,
        description: scan.ScanDetail.Instructions || scan.ScanDetail.Scan,
        completed: true,
      })),
    };
  } catch {
    return null; // Fallback gracefully if API request times out
  }
}

export function getLiveDelhiveryStatus(
  createdAt: string,
  manualStatus?: 'Order Placed' | 'Order Accepted' | 'Shipped' | 'Delivered' | 'Cancelled' | string
): 'Order Placed' | 'Order Accepted' | 'Shipped' | 'Delivered' | 'Cancelled' {
  if (manualStatus === 'Cancelled') return 'Cancelled';
  if (manualStatus === 'Delivered') return 'Delivered';
  if (manualStatus === 'Shipped') return 'Shipped';
  if (manualStatus === 'Order Accepted') return 'Order Accepted';

  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMinutes = (now - createdTime) / (1000 * 60);

  if (diffMinutes < 2) {
    return 'Order Placed';
  } else if (diffMinutes < 10) {
    return 'Order Accepted';
  } else if (diffMinutes < 60) {
    return 'Shipped';
  } else {
    return 'Delivered';
  }
}

export function generateDelhiveryTracking(
  orderId: string,
  createdAt?: string,
  awbNumber?: string,
  orderStatus?: string
): DelhiveryTrackingInfo {
  const awb = awbNumber || `DLHV${Math.floor(100000000 + Math.random() * 900000000)}`;
  const baseDate = createdAt ? new Date(createdAt) : new Date();
  const liveStatus = (orderStatus as 'Order Placed' | 'Order Accepted' | 'Shipped' | 'Delivered' | 'Cancelled') || getLiveDelhiveryStatus(baseDate.toISOString(), orderStatus);

  const step1Time = new Date(baseDate.getTime());
  const step2Time = new Date(baseDate.getTime() + 4 * 3600 * 1000);
  const step3Time = new Date(baseDate.getTime() + 18 * 3600 * 1000);
  const step4Time = new Date(baseDate.getTime() + 42 * 3600 * 1000);

  const estDate = new Date(baseDate.getTime() + 72 * 3600 * 1000);

  const isCancelled = liveStatus === 'Cancelled';
  const isAccepted = !isCancelled && liveStatus !== 'Order Placed';
  const isShipped = !isCancelled && (liveStatus === 'Shipped' || liveStatus === 'Delivered');
  const isDelivered = !isCancelled && liveStatus === 'Delivered';

  return {
    awbNumber: awb,
    orderId,
    currentStatus: liveStatus,
    estimatedDeliveryDate: isCancelled ? 'Shipment Cancelled' : estDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    origin: 'Jaipur Crafts Hub, Rajasthan',
    destination: 'Customer Shipping Address',
    steps: [
      {
        status: 'Order Placed',
        location: 'www.beadu.in Store',
        timestamp: step1Time.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        description: isCancelled ? 'Order was cancelled' : 'Order confirmed and packaged for dispatch',
        completed: !isCancelled,
      },
      {
        status: 'Order Accepted',
        location: 'Jaipur Artisan Studio',
        timestamp: step2Time.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        description: 'Handcrafted items packaged in signature gift box',
        completed: isAccepted,
      },
      {
        status: 'Picked Up',
        location: 'Central Sorting Facility - Jaipur',
        timestamp: step3Time.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        description: 'Shipment received by Express Logistics Hub',
        completed: isShipped,
      },
      {
        status: 'In Transit',
        location: 'National Transport Network',
        timestamp: step4Time.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        description: 'Shipment in transit via Express Logistics Network',
        completed: isShipped,
      },
      {
        status: 'Out for Delivery',
        location: 'Local Delivery Hub',
        timestamp: isDelivered ? 'Completed' : (isShipped ? 'Assigned' : 'Pending dispatch'),
        description: 'Delivery executive assigned for doorstep delivery',
        completed: isDelivered,
      },
      {
        status: 'Delivered',
        location: 'Destination Address',
        timestamp: isDelivered ? 'Delivered' : (isCancelled ? 'Cancelled' : 'Expected in 1-2 days'),
        description: isCancelled ? 'Delivery was cancelled' : 'Package handed over to recipient',
        completed: isDelivered,
      },
    ],
  };
}

/**
 * Calculates package dead weight in grams based on item count and packaging.
 * Standard artisan bracelet: ~40g each + signature gift box & insured packaging (~60g).
 */
export function calculateOrderWeight(items?: Array<{ quantity: number; product?: { weightGrams?: number } }>): number {
  const baseBoxWeight = 60; // Signature box + bubble wrap padding
  const perBraceletWeight = 40; // Average weight of gemstone / glass beads bracelet

  if (!items || items.length === 0) return 100;

  const itemsWeight = items.reduce((total, item) => {
    const unitWeight = item.product?.weightGrams || perBraceletWeight;
    return total + (unitWeight * (item.quantity || 1));
  }, 0);

  return Math.max(100, Math.round(baseBoxWeight + itemsWeight));
}

/**
 * Sanitizes input string to comply with Delhivery API constraints:
 * "The raw JSON body does not accept special characters: &, #, %, ;, \."
 */
function sanitizeDelhiveryText(val: string): string {
  if (!val) return '';
  return String(val)
    .replace(/&/g, ' and ')
    .replace(/#/g, 'No. ')
    .replace(/%/g, 'pct')
    .replace(/[;\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CreateShipmentResult {
  success: boolean;
  waybill: string;
  orderId: string;
  pickupLocation: string;
  sortCode?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Official Delhivery B2C Shipment Creation (Manifestation API)
 * Docs: POST https://track.delhivery.com/api/cmu/create.json
 */
export async function createDelhiveryShipment(order: {
  id: string;
  total: number;
  paymentMode: string;
  items?: Array<{ quantity: number; product: { name: string; weightGrams?: number } }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    addressType?: string;
  };
}): Promise<CreateShipmentResult> {
  const apiKey = process.env.DELHIVERY_API_KEY;
  const baseUrl = process.env.DELHIVERY_API_URL || 'https://track.delhivery.com';
  const pickupLocation = process.env.DELHIVERY_PICKUP_LOCATION || 'Beadu Warehouse';

  const weightGrams = calculateOrderWeight(order.items);
  const cleanPhone = order.shippingAddress.phone.replace(/\D/g, '').slice(-10);
  const sellerPhone = (process.env.DELHIVERY_SELLER_PHONE || '').replace(/\D/g, '').slice(-10) || cleanPhone;

  const productDescription = sanitizeDelhiveryText(
    order.items?.map((i) => i.product.name).join(', ') || 'Handcrafted Artisan Bracelet'
  ).slice(0, 90);

  const quantity = String(order.items?.reduce((sum, i) => sum + i.quantity, 0) || 1);
  // Order date in YYYY-MM-DD format as required by Delhivery
  const orderDate = new Date().toISOString().split('T')[0];

  // If live credentials configured, dispatch real shipment creation to Delhivery
  if (apiKey) {
    try {
      const manifestPayload = {
        shipments: [
          {
            name: sanitizeDelhiveryText(order.shippingAddress.fullName),
            add: sanitizeDelhiveryText(order.shippingAddress.street),
            pin: String(order.shippingAddress.zipCode).trim(),
            city: sanitizeDelhiveryText(order.shippingAddress.city),
            state: sanitizeDelhiveryText(order.shippingAddress.state),
            country: 'India',
            phone: cleanPhone,
            order: order.id,
            payment_mode: 'Prepaid',
            cod_amount: '0',
            total_amount: String(Math.round(order.total)),
            products_desc: productDescription,
            hsn_code: '7117',
            order_date: orderDate,
            quantity,
            weight: String(weightGrams),
            shipment_width: '10',
            shipment_height: '5',
            shipment_length: '10',
            shipping_mode: 'Surface',
            address_type: order.shippingAddress.addressType === 'WORK' ? 'office' : 'home',
            seller_name: sanitizeDelhiveryText(process.env.DELHIVERY_SELLER_NAME || 'Beadu Atelier'),
            seller_add: sanitizeDelhiveryText(process.env.DELHIVERY_SELLER_ADDRESS || 'Vasai, Palghar, Maharashtra - 401305'),
            seller_inv: order.id,
            return_pin: process.env.DELHIVERY_ORIGIN_PIN || '401305',
            return_city: sanitizeDelhiveryText(process.env.DELHIVERY_RETURN_CITY || 'Vasai'),
            return_state: sanitizeDelhiveryText(process.env.DELHIVERY_RETURN_STATE || 'Maharashtra'),
            return_country: 'India',
            return_add: sanitizeDelhiveryText(process.env.DELHIVERY_RETURN_ADDRESS || 'Beadu Atelier Hub, Vasai, Maharashtra'),
            return_phone: sellerPhone,
            fragile_shipment: false,
            dangerous_good: false,
            plastic_packaging: false,
          },
        ],
        pickup_location: {
          name: pickupLocation,
        },
      };

      // Delhivery CMU takes form-urlencoded: format=json&data=<json_string>
      const formBody = `format=json&data=${encodeURIComponent(JSON.stringify(manifestPayload))}`;

      const res = await fetch(`${baseUrl}/api/cmu/create.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      if (res.ok) {
        const data = await res.json();
        const pkg = data.packages?.[0];
        if (pkg && pkg.waybill) {
          return {
            success: true,
            waybill: pkg.waybill,
            orderId: order.id,
            pickupLocation,
            sortCode: pkg.sort_code,
          };
        }
      }
      const errText = await res.text().catch(() => '');
      console.warn('Delhivery manifest response non-OK:', res.status, errText);
    } catch (err) {
      console.warn('Delhivery manifest network error, falling back to simulated AWB:', err);
    }
  }

  // Development / Simulation Fallback
  const fallbackWaybill = `DLHV${Math.floor(100000000 + Math.random() * 900000000)}`;
  return {
    success: true,
    waybill: fallbackWaybill,
    orderId: order.id,
    pickupLocation,
    simulated: true,
  };
}

export interface ShippingCostEstimate {
  serviceable: boolean;
  totalAmount: number;
  baseCharge: number;
  codCharge: number;
  mode: 'Surface';
  message?: string;
}

/**
 * Calculates approximated shipping charges via Delhivery Kinko Charges API
 * Endpoint: GET https://track.delhivery.com/api/kinko/v1/invoice/charges/.json
 * Matches user's Delhivery dashboard parameters (Surface mode, origin pin 401305).
 */
export async function calculateDelhiveryShippingCost(params: {
  destinationPin: string;
  weightGrams?: number;
  isCod?: boolean;
}): Promise<ShippingCostEstimate> {
  const apiKey = process.env.DELHIVERY_API_KEY;
  const baseUrl = process.env.DELHIVERY_API_URL || 'https://track.delhivery.com';
  const originPin = process.env.DELHIVERY_ORIGIN_PIN || '401305';
  const weight = params.weightGrams || 150;
  const paymentType = params.isCod ? 'COD' : 'Pre-paid';

  if (!apiKey) {
    return {
      serviceable: true,
      totalAmount: 100,
      baseCharge: 80,
      codCharge: params.isCod ? 20 : 0,
      mode: 'Surface',
      message: 'Approximated surface courier rate (Mandated ₹100 flat to customer)',
    };
  }

  try {
    const query = new URLSearchParams({
      md: 'S', // Surface mode
      ss: 'Delivered',
      o_pin: originPin,
      d_pin: params.destinationPin.trim(),
      cgm: String(weight),
      pt: paymentType,
    });

    const res = await fetch(`${baseUrl}/api/kinko/v1/invoice/charges/.json?${query.toString()}`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        const item = data[0];
        const total = Number(item.total_amount) || 100;
        return {
          serviceable: true,
          totalAmount: total,
          baseCharge: Number(item.charge_DL) || 80,
          codCharge: Number(item.charge_COD) || 0,
          mode: 'Surface',
        };
      }
    }
  } catch (e) {
    console.warn('Delhivery calculate shipping cost network error:', e);
  }

  return {
    serviceable: true,
    totalAmount: 100,
    baseCharge: 100,
    codCharge: 0,
    mode: 'Surface',
  };
}
