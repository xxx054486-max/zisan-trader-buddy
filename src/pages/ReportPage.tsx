import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { CORRUPTION_TYPES } from "@/types";
import { DISTRICTS, THANAS } from "@/data/bdLocations";
import { Camera, Link as LinkIcon, MapPin, Loader2, Plus, X, Upload, Search } from "lucide-react";
import { toast } from "sonner";

export default function ReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [corruptionType, setCorruptionType] = useState("");
  const [base64Images, setBase64Images] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locMethod, setLocMethod] = useState<"auto" | "manual" | null>(null);
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [village, setVillage] = useState("");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-lg font-semibold mb-2">লগইন প্রয়োজন</p>
        <p className="text-sm text-muted-foreground mb-4">রিপোর্ট জমা দিতে আপনাকে লগইন করতে হবে</p>
        <button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold">লগইন করুন</button>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 500000) { toast.error("ছবির সাইজ ৫০০KB এর বেশি হতে পারবে না"); return; }
      const reader = new FileReader();
      reader.onload = () => setBase64Images((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const addLink = () => {
    if (linkInput.trim()) { setLinks((prev) => [...prev, linkInput.trim()]); setLinkInput(""); }
  };

  const detectLocation = () => {
    setDetectingLocation(true);
    setLocMethod("auto");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=bn`)
          .then((r) => r.json())
          .then((data) => setAddress(data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`))
          .catch(() => setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`))
          .finally(() => setDetectingLocation(false));
      },
      () => { toast.error("লোকেশন পাওয়া যায়নি"); setDetectingLocation(false); }
    );
  };

  const searchAddress = async () => {
    if (!address.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
      const data = await res.json();
      if (data[0]) { setLat(parseFloat(data[0].lat)); setLng(parseFloat(data[0].lon)); toast.success("অবস্থান পাওয়া গেছে"); }
      else toast.error("অবস্থান খুঁজে পাওয়া যায়নি");
    } catch { toast.error("অবস্থান খোঁজায় সমস্যা"); }
  };

  const buildFullAddress = () => {
    const parts = [address, village, thana, district].filter(Boolean);
    return parts.join(", ");
  };

  const handleSubmit = async () => {
    if (!description.trim()) return toast.error("বিবরণ লিখুন");
    if (!corruptionType) return toast.error("দুর্নীতির ধরন নির্বাচন করুন");
    if (base64Images.length === 0 && links.length === 0) return toast.error("অন্তত একটি প্রমাণ যোগ করুন");
    if (!lat || !lng) return toast.error("অবস্থান নির্বাচন করুন");

    setSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        userId: user.uid,
        description: description.trim(),
        corruptionType,
        location: { lat, lng, address: buildFullAddress() },
        evidenceBase64: base64Images,
        evidenceLinks: links,
        status: "pending",
        votes: { true: 0, suspicious: 0, needEvidence: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("রিপোর্ট সফলভাবে জমা হয়েছে!");
      navigate("/my-reports");
    } catch { toast.error("রিপোর্ট জমা দিতে সমস্যা হয়েছে"); }
    finally { setSubmitting(false); }
  };

  const availableThanas = district ? (THANAS[district] || []) : [];

  return (
    <div className="p-4 space-y-5 pb-8">
      <h2 className="text-lg font-bold">নতুন রিপোর্ট</h2>

      {/* Corruption Type */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-foreground">দুর্নীতির ধরন <span className="text-destructive">*</span></label>
        <select value={corruptionType} onChange={(e) => setCorruptionType(e.target.value)} className="w-full border-[1.5px] border-input rounded-xl px-3.5 py-3 text-sm bg-card outline-none focus:border-primary transition-colors">
          <option value="">নির্বাচন করুন</option>
          {CORRUPTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-foreground">বিবরণ <span className="text-destructive">*</span></label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="দুর্নীতির বিস্তারিত বিবরণ লিখুন..." className="w-full border-[1.5px] border-input rounded-xl px-3.5 py-3 text-sm bg-card resize-none outline-none focus:border-primary transition-colors leading-relaxed" />
      </div>

      {/* Evidence */}
      <div className="space-y-3">
        <label className="text-[13px] font-semibold text-foreground">প্রমাণ (ছবি/লিংক) <span className="text-destructive">*</span></label>
        <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-input rounded-xl bg-muted/30 cursor-pointer active:border-primary active:bg-accent transition-all">
          <Upload size={28} className="text-muted-foreground" />
          <p className="text-[13px] text-muted-foreground">ছবি আপলোড করুন</p>
          <span className="text-[12px] text-primary font-semibold">সর্বোচ্চ ৫০০KB</span>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        </label>

        {base64Images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {base64Images.map((img, i) => (
              <div key={i} className="relative w-[72px] h-[72px]">
                <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                <button onClick={() => setBase64Images((prev) => prev.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"><X size={10} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="প্রমাণের লিংক দিন (ভিডিও/ছবি/ওয়েবসাইট)" className="flex-1 border-[1.5px] border-input rounded-xl px-3.5 py-2.5 text-[13px] bg-card outline-none focus:border-primary transition-colors" onKeyDown={(e) => e.key === "Enter" && addLink()} />
          <button onClick={addLink} className="bg-primary text-primary-foreground px-3.5 rounded-xl text-[13px] font-semibold whitespace-nowrap">Add</button>
        </div>

        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2 text-xs bg-muted rounded-xl px-3 py-2.5">
            <LinkIcon size={12} className="text-muted-foreground shrink-0" />
            <span className="truncate flex-1">{link}</span>
            <button onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))} className="text-destructive shrink-0"><X size={14} /></button>
          </div>
        ))}
      </div>

      {/* Location */}
      <div className="space-y-3">
        <label className="text-[13px] font-semibold text-foreground">অবস্থান <span className="text-destructive">*</span></label>

        <div className="flex gap-2">
          <button onClick={detectLocation} disabled={detectingLocation} className={`flex-1 flex flex-col items-center gap-1.5 py-3 border-[1.5px] rounded-xl transition-all ${locMethod === "auto" && lat ? "border-primary bg-accent" : "border-input bg-card"}`}>
            {detectingLocation ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : <MapPin size={20} className={locMethod === "auto" && lat ? "text-primary" : "text-muted-foreground"} />}
            <span className={`text-[12px] font-medium ${locMethod === "auto" && lat ? "text-primary" : "text-muted-foreground"}`}>অটো সনাক্ত</span>
          </button>
          <button onClick={() => setLocMethod("manual")} className={`flex-1 flex flex-col items-center gap-1.5 py-3 border-[1.5px] rounded-xl transition-all ${locMethod === "manual" ? "border-primary bg-accent" : "border-input bg-card"}`}>
            <Search size={20} className={locMethod === "manual" ? "text-primary" : "text-muted-foreground"} />
            <span className={`text-[12px] font-medium ${locMethod === "manual" ? "text-primary" : "text-muted-foreground"}`}>ঠিকানা লিখুন</span>
          </button>
        </div>

        {locMethod === "manual" && (
          <div className="flex gap-2">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ঠিকানা লিখুন..." className="flex-1 border-[1.5px] border-input rounded-xl px-3.5 py-2.5 text-[13px] bg-card outline-none focus:border-primary transition-colors" onKeyDown={(e) => e.key === "Enter" && searchAddress()} />
            <button onClick={searchAddress} className="bg-primary text-primary-foreground px-3 rounded-xl text-[12px] font-semibold">📍 খুঁজুন</button>
          </div>
        )}

        {/* District / Thana / Village selectors */}
        <div className="grid grid-cols-2 gap-2">
          <select value={district} onChange={(e) => { setDistrict(e.target.value); setThana(""); }} className="border-[1.5px] border-input rounded-xl px-3 py-2.5 text-[12px] bg-card outline-none focus:border-primary">
            <option value="">জেলা নির্বাচন</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={thana} onChange={(e) => setThana(e.target.value)} disabled={!district} className="border-[1.5px] border-input rounded-xl px-3 py-2.5 text-[12px] bg-card outline-none focus:border-primary disabled:opacity-50">
            <option value="">থানা নির্বাচন</option>
            {availableThanas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="গ্রাম/এলাকার নাম (ঐচ্ছিক)" className="w-full border-[1.5px] border-input rounded-xl px-3.5 py-2.5 text-[13px] bg-card outline-none focus:border-primary transition-colors" />

        {address && (
          <div className="bg-muted rounded-xl px-3 py-2.5 text-[12px] text-muted-foreground space-y-1">
            <p>📍 {address}</p>
            {lat && lng && <p className="text-[11px]">Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</p>}
          </div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={submitting} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 active:opacity-90 transition-all">
        {submitting && <Loader2 size={16} className="animate-spin" />}
        রিপোর্ট জমা দিন
      </button>
    </div>
  );
}
