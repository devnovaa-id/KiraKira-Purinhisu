import { spawn } from 'child_process';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';
import { format } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        // Cek apakah ada video yang dikutip atau diupload
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        if (!mime.match(/video.*/) && !mime.match(/image.*/)) {
            return m.reply(`🚫 *Video/Image tidak ditemukan!*\n\nKirim video atau gambar dengan caption *${usedPrefix + command}* atau reply video/gambar dengan perintah ini.`);
        }
        
        m.reply('🔄 *Memproses video...*\nMohon tunggu, proses mungkin memakan waktu beberapa menit.');
        
        // Download media
        let media = await q.download();
        let inputPath = path.join(tmpdir(), `input_${Date.now()}.${mime.includes('video') ? 'mp4' : 'jpg'}`);
        let outputPath = path.join(tmpdir(), `output_${Date.now()}.mp4`);
        
        await fs.promises.writeFile(inputPath, media);
        
        // Parameter FFmpeg untuk optimalisasi WhatsApp Story
        const ffmpegArgs = [
            '-i', inputPath,
            '-c:v', 'libx264',           // Codec video H.264 (didukung WA)
            '-preset', 'slow',           // Preset untuk kualitas lebih baik
            '-crf', '18',                // Constant Rate Factor (rendah = kualitas tinggi)
            '-vf', 'scale=1920:1080:flags=lanczos', // Upscale ke 1080p (maksimal WA Story)
            '-c:a', 'aac',               // Codec audio AAC
            '-b:a', '192k',              // Bitrate audio
            '-movflags', '+faststart',   // Optimasi untuk streaming
            '-pix_fmt', 'yuv420p',       // Format pixel kompatibel
            '-profile:v', 'high',        // Profile H.264
            '-level', '4.2',             // Level H.264
            '-maxrate', '5M',            // Bitrate maksimal
            '-bufsize', '10M',           // Buffer size
            '-r', '30',                  // Frame rate 30fps
            '-ar', '44100',              // Sample rate audio
            '-f', 'mp4',                 // Format output
            '-y',                        // Overwrite output
            outputPath
        ];
        
        // Eksekusi FFmpeg
        await new Promise((resolve, reject) => {
            const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
            
            let stderr = '';
            ffmpegProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg failed with code ${code}\n${stderr}`));
                }
            });
            
            ffmpegProcess.on('error', (err) => {
                reject(err);
            });
        });
        
        // Kirim video hasil
        const processedVideo = await fs.promises.readFile(outputPath);
        const fileSize = processedVideo.length / (1024 * 1024); // Size dalam MB
        
        if (fileSize > 50) { // WhatsApp batas sekitar 16MB, kita beri buffer
            // Jika terlalu besar, kompres lagi dengan bitrate lebih rendah
            m.reply('📦 *Video terlalu besar, mengoptimalkan ukuran...*');
            
            const compressedPath = path.join(tmpdir(), `compressed_${Date.now()}.mp4`);
            const compressArgs = [
                '-i', outputPath,
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                '-f', 'mp4',
                '-y',
                compressedPath
            ];
            
            await new Promise((resolve, reject) => {
                const ffmpegProcess = spawn('ffmpeg', compressArgs);
                ffmpegProcess.on('close', resolve);
                ffmpegProcess.on('error', reject);
            });
            
            const finalVideo = await fs.promises.readFile(compressedPath);
            await conn.sendMessage(m.chat, {
                video: finalVideo,
                caption: `✅ *Video Enhanced Successfully!*\n\n📊 *Optimized for WhatsApp Story*\n⚡ *Anti-Compression*\n🎨 *Enhanced Quality*\n\nVideo telah dioptimalkan untuk upload WhatsApp Story dengan kualitas terjaga.`,
                fileName: 'enhanced_video.mp4'
            }, { quoted: m });
            
            // Cleanup
            await fs.promises.unlink(compressedPath).catch(() => {});
        } else {
            await conn.sendMessage(m.chat, {
                video: processedVideo,
                caption: `✅ *Video Enhanced Successfully!*\n\n📊 *Optimized for WhatsApp Story*\n⚡ *Anti-Compression*\n🎨 *Enhanced Quality*\n\nVideo telah dioptimalkan untuk upload WhatsApp Story dengan kualitas terjaga.`,
                fileName: 'enhanced_video.mp4'
            }, { quoted: m });
        }
        
        // Cleanup temporary files
        await fs.promises.unlink(inputPath).catch(() => {});
        await fs.promises.unlink(outputPath).catch(() => {});
        
    } catch (error) {
        console.error(error);
        m.reply(`❌ *Error!*\n${error.message}\n\nPastikan FFmpeg terinstall di server dan video tidak corrupt.`);
    }
};

handler.help = ['to8k', 'enhance', 'upvideo'];
handler.tags = ['tools'];
handler.command = /^(to8k|enhance|upvideo|improve)$/i;
handler.limit = true;
handler.premium = false;
handler.register = false;

export default handler;