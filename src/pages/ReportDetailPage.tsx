import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, getDoc, updateDoc, increment, setDoc, deleteDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Report } from "@/types";
import CommentSection from "@/components/CommentSection";
import ImageCarousel from "@/components/ImageCarousel";
import LinkPreview from "@/components/LinkPreview";
import LinkifyText from "@/components/LinkifyText";
import { ArrowLeft, MapPin, CheckCircle, AlertTriangle, HelpCircle, Share2, Loader2, User, Info, Plus, Send } from "lucide-react";
import { toast } from "sonner";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [showUpdateInput, setShowUpdateInput] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "reports", id), (snap) => {
      if (snap.exists()) setReport({ id: snap.id, ...snap.data() } as Report);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    getDoc(doc(db, "votes", `${id}_${user.uid}`)).then((snap) => {
      if (snap.exists()) setUserVote(snap.data().type);
    });
  }, [user, id]);

  const handleVote = async (type: "true" | "suspicious" | "needEvidence") => {
    if (!user) return toast.error("ভোট দিতে লগইন করুন");
    if (!id || voting) return;
    setVoting(true);
    const voteRef = doc(db, "votes", `${id}_${user.uid}`);
    const reportRef = doc(db, "reports", id);
    try {
      if (userVote === type) {
        await deleteDoc(voteRef);
        await updateDoc(reportRef, { [`votes.${type}`]: increment(-1) });
        setUserVote(null);
      } else {
        if (userVote) await updateDoc(reportRef, { [`votes.${userVote}`]: increment(-1) });
        await setDoc(voteRef, { reportId: id, userId: user.uid, type });
        await updateDoc(reportRef, { [`votes.${type}`]: increment(1) });
        setUserVote(type);
      }
    } catch { toast.error("ভোট দিতে সমস্যা হয়েছে"); }
    finally { setVoting(false); }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: "দুর্নীতি রিপোর্ট", url });
    else { navigator.clipboard.writeText(url); toast.success("Link copied"); }
  };

  const handleSubmitUpdate = async () => {
    if (!updateText.trim() || !id || !user) return;
    setSubmittingUpdate(true);
    try {
      const newUpdate = {
        id: Date.now().toString(),
        text: updateText.trim(),
        status: "pending",
        createdAt: Timestamp.now(),
      };
      await updateDoc(doc(db, "reports", id), {
        userUpdates: arrayUnion(newUpdate),
      });
      toast.success("আপডেট জমা হয়েছে, অ্যাডমিন যাচাই করার পর দেখাবে");
      setUpdateText("");
      setShowUpdateInput(false);
    } catch { toast.error("আপডেট জমা দিতে সমস্যা হয়েছে"); }
    finally { setSubmittingUpdate(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!report) return <div className="flex flex-col items-center justify-center h-screen"><p className="text-lg font-semibold">রিপোর্ট পাওয়া যায়নি</p><button onClick={() => navigate("/")} className="text-primary mt-2 text-sm font-medium">← হোমে ফিরুন</button></div>;

  const date = report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString("bn-BD") : "অজানা তারিখ";
  const isOwner = user && report.userId === user.uid;
  const approvedUpdates = (report.userUpdates || []).filter((u) => u.status === "approved");

  const voteButtons = [
    { type: "true" as const, label: "সত্য", icon: CheckCircle },
    { type: "suspicious" as const, label: "সন্দেহজনক", icon: AlertTriangle },
    { type: "needEvidence" as const, label: "প্রমাণ চাই", icon: HelpCircle },
  ];

  const allImages = [
    ...(report.evidenceBase64 || []),
    ...(report.evidenceLinks || []).filter((url) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url)),
  ];
  const videoLinks = (report.evidenceLinks || []).filter((url) =>
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(url) || /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url)
  );
  const otherLinks = (report.evidenceLinks || []).filter(
    (url) => !/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url) && !/\.(mp4|webm|ogg)(\?.*)?$/i.test(url) && !/(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url)
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      <header className="flex items-center gap-3 px-4 h-14 bg-card border-b border-border shrink-0 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><ArrowLeft size={18} /></button>
        <h1 className="text-base font-bold flex-1">সম্পূর্ণ রিপোর্ট</h1>
        <button onClick={handleShare} className="p-2"><Share2 size={18} className="text-muted-foreground" /></button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-card">
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0"><User size={20} className="text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold">Anonymous</p>
              <p className="text-[11px] text-muted-foreground">{date}</p>
            </div>
            <span className="text-[10px] font-bold bg-accent text-accent-foreground px-2.5 py-1 rounded-full">{report.corruptionType}</span>
          </div>

          <div className="px-4 pb-3">
            <LinkifyText text={report.description} className="text-sm leading-relaxed whitespace-pre-wrap" />
          </div>

          {/* Admin Action Note */}
          {report.actionTaken && (
            <div className="mx-4 mb-3 bg-accent rounded-lg px-3 py-2 flex items-start gap-2">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[12px] text-accent-foreground"><span className="font-semibold">কর্তৃপক্ষের আপডেট:</span> {report.actionTaken}</p>
            </div>
          )}

          {/* Approved User Updates */}
          {approvedUpdates.length > 0 && (
            <div className="mx-4 mb-3 space-y-2">
              {approvedUpdates.map((upd) => (
                <div key={upd.id} className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Info size={14} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-primary mb-0.5">রিপোর্টারের আপডেট</p>
                    <p className="text-[12px] text-foreground">{upd.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(allImages.length > 0 || videoLinks.length > 0) && (
            <ImageCarousel images={allImages} videoUrls={videoLinks} />
          )}

          {otherLinks.length > 0 && (
            <div className="px-4 py-2 space-y-2">
              {otherLinks.map((link, i) => <LinkPreview key={i} url={link} />)}
            </div>
          )}

          <div className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-muted-foreground">
            <MapPin size={14} className="text-primary shrink-0" />
            <span>{report.location?.address || "অজানা অবস্থান"}</span>
          </div>

          {/* User Update Button (only for report owner) */}
          {isOwner && (
            <div className="px-4 pb-3">
              {showUpdateInput ? (
                <div className="space-y-2">
                  <textarea
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="বর্তমান অবস্থা বা আপডেট লিখুন..."
                    rows={3}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSubmitUpdate} disabled={submittingUpdate || !updateText.trim()} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-[12px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
                      {submittingUpdate ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} আপডেট জমা দিন
                    </button>
                    <button onClick={() => { setShowUpdateInput(false); setUpdateText(""); }} className="px-4 py-2 rounded-xl bg-muted text-foreground text-[12px] font-semibold">বাতিল</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowUpdateInput(true)} className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-[13px] font-semibold flex items-center justify-center gap-1.5">
                  <Plus size={14} /> আপডেট যোগ করুন
                </button>
              )}
            </div>
          )}

          <div className="flex border-t border-border">
            {voteButtons.map((v) => (
              <button
                key={v.type}
                onClick={() => handleVote(v.type)}
                disabled={voting}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-all border-r border-border last:border-r-0 ${userVote === v.type ? "bg-accent" : "active:bg-muted"}`}
              >
                <v.icon size={18} className={userVote === v.type ? "text-primary" : "text-muted-foreground"} />
                <span className={`text-[10px] font-medium ${userVote === v.type ? "text-primary" : "text-muted-foreground"}`}>
                  {v.label} ({report.votes?.[v.type] || 0})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4">
          <CommentSection reportId={report.id} />
        </div>
      </div>
    </div>
  );
}
