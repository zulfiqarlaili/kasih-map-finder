import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, CreditCard, HelpCircle, Users, Shield } from 'lucide-react';

const FAQ = () => {
  const faqData = [
    {
      category: "Apa itu MyKasih?",
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        {
          question: "Apa itu program MyKasih?",
          answer: "MyKasih adalah program bantuan makanan yang disediakan oleh MyKasih Foundation untuk membantu keluarga B40 di Malaysia. Program ini menggunakan sistem cashless melalui MyKad untuk memudahkan penerima bantuan membeli keperluan asas di kedai-kedai yang berdaftar."
        },
        {
          question: "Siapa yang layak menerima bantuan MyKasih?",
          answer: "Program MyKasih ditujukan kepada keluarga B40 (Bottom 40%) yang berpendapatan rendah di Malaysia. Kelayakan ditentukan berdasarkan kriteria pendapatan isi rumah dan status sosioekonomi yang ditetapkan oleh kerajaan Malaysia."
        },
        {
          question: "Berapa nilai bantuan yang diberikan MyKasih?",
          answer: "Nilai bantuan MyKasih berbeza mengikut program dan keperluan. Biasanya, penerima akan menerima kredit dalam MyKad mereka yang boleh digunakan untuk membeli barang-barang keperluan asas di kedai-kedai yang berdaftar dengan MyKasih."
        }
      ]
    },
    {
      category: "Cara Menggunakan MyKasih",
      icon: <CreditCard className="w-5 h-5" />,
      questions: [
        {
          question: "Bagaimana cara menggunakan MyKasih di kedai?",
          answer: "Untuk menggunakan MyKasih, anda perlu pergi ke kedai yang berdaftar dengan MyKasih. Semasa membuat pembayaran, tunjukkan MyKad anda kepada juruwang dan mereka akan memproses pembayaran menggunakan kredit MyKasih yang ada dalam kad anda."
        },
        {
          question: "Adakah semua kedai menerima MyKasih?",
          answer: "Tidak semua kedai menerima MyKasih. Hanya kedai-kedai yang berdaftar dengan program MyKasih sahaja yang boleh menerima pembayaran melalui sistem ini. Gunakan aplikasi ini untuk mencari kedai-kedai yang berdaftar di kawasan anda."
        },
        {
          question: "Apa yang boleh dibeli dengan MyKasih?",
          answer: "MyKasih boleh digunakan untuk membeli barang-barang keperluan asas seperti beras, minyak masak, gula, garam, dan barang-barang makanan asas yang lain. Senarai barang yang dibenarkan mungkin berbeza mengikut kedai dan program semasa."
        }
      ]
    },
    {
      category: "Kedai Berdaftar MyKasih",
      icon: <MapPin className="w-5 h-5" />,
      questions: [
        {
          question: "Di mana saya boleh mencari kedai yang berdaftar MyKasih?",
          answer: "Anda boleh menggunakan aplikasi MyKasih Store Finder ini untuk mencari kedai-kedai yang berdaftar di kawasan anda. Aplikasi ini akan menunjukkan lokasi kedai terdekat dengan peta interaktif dan maklumat lengkap kedai."
        },
        {
          question: "Adakah 99 Speedmart menerima MyKasih?",
          answer: "Ya, 99 Speedmart adalah salah satu rakan kongsi utama MyKasih dan kebanyakan cawangan mereka menerima pembayaran melalui sistem MyKasih. Gunakan aplikasi ini untuk mencari cawangan 99 Speedmart terdekat yang berdaftar."
        },
        {
          question: "Bagaimana saya tahu kedai tersebut masih aktif menerima MyKasih?",
          answer: "Senarai kedai dalam aplikasi ini dikemas kini secara berkala. Walau bagaimanapun, adalah disyorkan untuk menghubungi kedai terlebih dahulu untuk memastikan mereka masih aktif menerima MyKasih sebelum membuat perjalanan."
        }
      ]
    },
    {
      category: "Masalah Teknikal",
      icon: <Shield className="w-5 h-5" />,
      questions: [
        {
          question: "MyKasih tidak berfungsi di kedai, apa yang perlu saya lakukan?",
          answer: "Jika MyKasih tidak berfungsi, pastikan MyKad anda dalam keadaan baik dan tidak rosak. Jika masalah berterusan, hubungi pusat khidmat pelanggan MyKasih atau pergi ke pejabat pos terdekat untuk mendapatkan bantuan."
        },
        {
          question: "Bagaimana untuk memeriksa baki MyKasih saya?",
          answer: "Anda boleh memeriksa baki MyKasih anda di pejabat pos terdekat atau melalui sistem semakan dalam talian yang disediakan oleh MyKasih Foundation. Pastikan anda membawa MyKad untuk tujuan pengesahan."
        },
        {
          question: "Apa yang perlu saya lakukan jika MyKad hilang?",
          answer: "Jika MyKad anda hilang, segera laporkan kepada pihak berkuasa dan buat kad baru di pejabat pos terdekat. Anda juga perlu menghubungi MyKasih Foundation untuk memindahkan baki kredit ke kad baru anda."
        }
      ]
    },
    {
      category: "Maklumat Am",
      icon: <Users className="w-5 h-5" />,
      questions: [
        {
          question: "Adakah MyKasih sama dengan Bantuan Tunai Rahmah (STR)?",
          answer: "Tidak, MyKasih dan Bantuan Tunai Rahmah (STR) adalah program yang berbeza. MyKasih adalah program bantuan makanan cashless, manakala STR adalah bantuan tunai langsung. Kedua-dua program ini mempunyai kriteria kelayakan dan cara penggunaan yang berbeza."
        },
        {
          question: "Bilakah program MyKasih bermula?",
          answer: "Program MyKasih telah bermula sejak beberapa tahun yang lalu dan terus berkembang untuk membantu lebih ramai keluarga B40 di Malaysia. Program ini adalah inisiatif jangka panjang untuk mengurangkan beban kos sara hidup."
        },
        {
          question: "Bagaimana untuk mendapatkan maklumat terkini tentang MyKasih?",
          answer: "Anda boleh mendapatkan maklumat terkini tentang MyKasih melalui laman web rasmi MyKasih Foundation, media sosial rasmi, atau menghubungi pusat khidmat pelanggan mereka. Aplikasi ini juga akan dikemas kini dengan maklumat terkini."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Soalan Lazim (FAQ) MyKasih
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Jawapan kepada soalan-soalan yang sering ditanya tentang program MyKasih, 
            cara menggunakannya, dan mencari kedai berdaftar di Malaysia.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge variant="secondary">MyKasih</Badge>
            <Badge variant="secondary">Kedai Berdaftar</Badge>
            <Badge variant="secondary">Bantuan Makanan</Badge>
            <Badge variant="secondary">B40 Malaysia</Badge>
            <Badge variant="secondary">99 Speedmart</Badge>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {faqData.map((section, sectionIndex) => (
            <Card key={sectionIndex} className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  {section.icon}
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((faq, faqIndex) => (
                    <AccordionItem 
                      key={faqIndex} 
                      value={`item-${sectionIndex}-${faqIndex}`}
                      className="border-b border-border/50"
                    >
                      <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                        <span className="font-medium text-foreground">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <p className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock className="w-5 h-5" />
                Maklumat Penting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-blue-800 dark:text-blue-200">
                <p>
                  <strong>Waktu Operasi Kedai:</strong> Kebanyakan kedai berdaftar MyKasih beroperasi 
                  mengikut waktu perniagaan biasa. Pastikan anda memeriksa waktu operasi kedai 
                  sebelum melawat.
                </p>
                <p>
                  <strong>Kemas Kini Maklumat:</strong> Senarai kedai dalam aplikasi ini dikemas kini 
                  secara berkala. Jika anda mendapati maklumat yang tidak tepat, sila hubungi 
                  pusat khidmat pelanggan MyKasih.
                </p>
                <p>
                  <strong>Bantuan Tambahan:</strong> Jika anda memerlukan bantuan tambahan atau 
                  mempunyai soalan yang tidak terjawab, sila hubungi MyKasih Foundation 
                  atau lawati pejabat pos terdekat.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
