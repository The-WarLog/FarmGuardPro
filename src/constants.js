// constants.js
// Add static data and text here
export const PROJECT_INFO = {
  name: "FarmGuard Pro",
  language: "React with JavaScript",
  diseases: ["Leaf Blight", "Powdery Mildew", "Bacterial Spot", "Rust", "Mosaic Virus"],
  chatbotFeatures: ["Disease Identification", "Treatment Recommendations", "Prevention Tips", "Multilingual Support"],
  dataInteractivity: ["Real-time Charts", "Disease Trends", "Regional Analysis", "Interactive Maps"]
};

export const diseaseData = [
    { month: 'Jan', leafBlight: 12, powderyMildew: 8, bacterialSpot: 5, rust: 3, mosaic: 2 },
    { month: 'Feb', leafBlight: 15, powderyMildew: 12, bacterialSpot: 8, rust: 6, mosaic: 4 },
    { month: 'Mar', leafBlight: 18, powderyMildew: 15, bacterialSpot: 12, rust: 9, mosaic: 7 },
    { month: 'Apr', leafBlight: 22, powderyMildew: 18, bacterialSpot: 15, rust: 12, mosaic: 10 },
    { month: 'May', leafBlight: 28, powderyMildew: 25, bacterialSpot: 20, rust: 18, mosaic: 15 },
    { month: 'Jun', leafBlight: 35, powderyMildew: 32, bacterialSpot: 28, rust: 25, mosaic: 22 }
];

export const regionData = [
    { name: 'Punjab', value: 35, color: '#0ea5e9' },
    { name: 'Haryana', value: 28, color: '#06b6d4' },
    { name: 'UP', value: 22, color: '#10b981' },
    { name: 'Bihar', value: 15, color: '#3b82f6' }
];

export const texts = {
    english: {
      title: "FarmGuard Pro - Plant Disease Detection System",
      subtitle: "Advanced AI-powered solution for early detection and management of crop diseases",
      description: "This application helps farmers identify diseases in their crops using artificial intelligence, increasing yield and reducing losses through early detection and proper treatment recommendations.",
      features: {
        detection: "AI Disease Detection",
        chat: "Smart Assistant",
        analytics: "Data Analytics",
        upload: "Upload Image"
      },
      tabs: {
        home: "Home",
        detection: "Detection",
        chatbot: "Assistant",
        analytics: "Analytics"
      }
    },
    hindi: {
      title: "फार्मगार्ड प्रो - पौधों की बीमारी पहचान प्रणाली",
      subtitle: "फसल की बीमारियों की जल्दी पहचान और प्रबंधन के लिए उन्नत AI समाधान",
      description: "यह एप्लिकेशन कृत्रिम बुद्धिमत्ता का उपयोग करके किसानों को उनकी फसलों में बीमारियों की पहचान करने में मदद करता है, जल्दी पहचान और उचित उपचार सिफारिशों के माध्यम से उत्पादन बढ़ाता है और नुकसान कम करता है।",
      features: {
        detection: "AI बीमारी पहचान",
        chat: "स्मार्ट सहायक",
        analytics: "डेटा विश्लेषण",
        upload: "छवि अपलोड करें"
      },
      tabs: {
        home: "होम",
        detection: "पहचान",
        chatbot: "सहायक",
        analytics: "विश्लेषण"
      }
    }
};

export const diseaseDatabase = {
    'leaf blight': {
      symptoms: 'Brown spots on leaves, yellowing, wilting',
      treatment: 'Apply copper-based fungicide, improve drainage',
      prevention: 'Crop rotation, resistant varieties, proper spacing',
      hindi: {
        symptoms: 'पत्तियों पर भूरे धब्बे, पीलापन, मुरझाना',
        treatment: 'कॉपर आधारित कवकनाशी का प्रयोग करें, जल निकासी सुधारें',
        prevention: 'फसल चक्र, प्रतिरोधी किस्में, उचित दूरी'
      }
    },
    'powdery mildew': {
      symptoms: 'White powdery coating on leaves, stunted growth',
      treatment: 'Sulfur spray, neem oil application',
      prevention: 'Good air circulation, avoid overhead watering',
      hindi: {
        symptoms: 'पत्तियों पर सफेद पाउडर जैसी परत, वृद्धि रुकना',
        treatment: 'सल्फर स्प्रे, नीम तेल का प्रयोग',
        prevention: 'अच्छा हवा प्रसार, ऊपर से पानी न देना'
      }
    }
};