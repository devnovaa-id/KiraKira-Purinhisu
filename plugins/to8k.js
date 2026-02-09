import { spawn } from 'child_process';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import moment from 'moment-timezone';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        // Cek apakah ada video yang dikutip atau diupload
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        
        if (!mime.match(/video.*/) && !mime.match(/image.*/)) {
            return m.reply(`🚫 *Video/Image tidak ditemukan!*\n\nKirim video atau gambar dengan caption *${usedPrefix + command}* atau reply video/gambar dengan perintah ini.`);
        }
        
        // Kirim pesan awal dengan progress bar animasi
        let progressMsg;
        let progressInterval;
        
        const startProgressAnimation = async () => {
            const frames = ['▰▱▱▱▱▱▱', '▰▰▱▱▱▱▱', '▰▰▰▱▱▱▱', '▰▰▰▰▱▱▱', '▰▰▰▰▰▱▱', '▰▰▰▰▰▰▱', '▰▰▰▰▰▰▰'];
            let frameIndex = 0;
            const startTime = moment();
            
            progressMsg = await m.reply(`🎬 *VIDEO ENHANCEMENT PREMIUM*\n\n${frames[0]} 0%\n📊 Status: Mendownload video...\n⏱️ Mulai: ${startTime.format('HH:mm:ss')}\n⚡ Mode: Premium Quality`);
            
            progressInterval = setInterval(async () => {
                try {
                    frameIndex = (frameIndex + 1) % frames.length;
                    const elapsed = moment().diff(startTime, 'seconds');
                    const progressText = `${frames[frameIndex]} ${Math.floor((frameIndex / frames.length) * 15)}%`;
                    
                    await conn.sendMessage(m.chat, {
                        text: `🎬 *VIDEO ENHANCEMENT PREMIUM*\n\n${progressText}\n📊 Status: Processing...\n⏱️ Waktu: ${elapsed} detik\n⚡ Mode: Premium Quality`,
                        edit: progressMsg.key
                    });
                } catch (e) {
                    // Ignore edit errors
                }
            }, 500);
        };
        
        await startProgressAnimation();
        
        // Log awal di konsol
        console.log('\n' + chalk.cyan('╔══════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║          🎬 PREMIUM VIDEO ENHANCEMENT TO8K           ║'));
        console.log(chalk.cyan('╚══════════════════════════════════════════════════╝'));
        console.log(chalk.yellow(`📅 ${moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')}`));
        console.log(chalk.blue(`👤 User: ${m.sender.split('@')[0]}`));
        console.log(chalk.blue(`💬 Chat: ${m.chat}`));
        console.log(chalk.cyan('════════════════════════════════════════════════════'));
        
        // Download media
        let media = await q.download();
        let inputPath = path.join(tmpdir(), `input_${Date.now()}.${mime.includes('video') ? 'mp4' : mime.includes('image') ? 'jpg' : 'bin'}`);
        let outputPath = path.join(tmpdir(), `output_premium_${Date.now()}.mp4`);
        
        await fs.promises.writeFile(inputPath, media);
        
        console.log(chalk.green('✅ Video downloaded successfully'));
        console.log(chalk.gray(`📁 Input: ${inputPath}`));
        console.log(chalk.gray(`📁 Output: ${outputPath}`));
        console.log(chalk.cyan('════════════════════════════════════════════════════'));
        
        // Update progress ke encoding
        clearInterval(progressInterval);
        await conn.sendMessage(m.chat, {
            text: `🎬 *VIDEO ENHANCEMENT PREMIUM*\n\n▰▰▰▱▱▱ 25%\n📊 Status: Encoding video...\n⚙️ Proses: FFmpeg Premium Enhancement\n✨ Quality: Maximum Clarity`,
            edit: progressMsg.key
        });
        
        // PARAMETER FFMPEG PREMIUM QUALITY dengan aspect ratio terjaga
        const ffmpegArgs = [
            '-threads', '0',           // Gunakan semua core CPU
            '-i', inputPath,
            '-c:v', 'libx264',
            '-preset', 'medium',       // Balance antara kualitas & kecepatan
            '-crf', '18',              // Kualitas sangat tinggi (16-18 = premium)
            '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-b:v', '8M',              // Bitrate video target (tinggi untuk kualitas)
            '-maxrate', '12M',         // Bitrate maksimum
            '-bufsize', '15M',         // Buffer size
            '-profile:v', 'high',
            '-level', '4.2',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-tune', 'film',           // Optimasi untuk konten film
            '-x264-params', 'aq-mode=3:aq-strength=1.0:psy-rd=1.0,1.0',
            '-f', 'mp4',
            '-y',
            outputPath
        ];
        
        // Eksekusi FFmpeg dengan output ke console
        console.log(chalk.yellow('🚀 Starting FFmpeg Premium Process...'));
        console.log(chalk.gray('Command: ffmpeg ' + ffmpegArgs.join(' ')));
        console.log(chalk.cyan('════════════════════════════════════════════════════'));
        
        const startTime = Date.now();
        let lastProgress = 0;
        
        await new Promise((resolve, reject) => {
            const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
            
            // Tampilkan output FFmpeg di console
            ffmpegProcess.stderr.on('data', (data) => {
                const line = data.toString();
                
                // Parse progress dari output FFmpeg
                if (line.includes('frame=') || line.includes('fps=') || line.includes('time=')) {
                    console.log(chalk.gray(`[FFMPEG] ${line.trim()}`));
                    
                    // Ekstrak progress dari output
                    const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1]);
                        const minutes = parseInt(timeMatch[2]);
                        const seconds = parseFloat(timeMatch[3]);
                        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                        
                        // Asumsikan video maksimal 60 detik untuk progress estimation
                        // (Ini bisa disesuaikan dengan duration actual video)
                        const progress = Math.min(90, Math.floor((totalSeconds / 60) * 100));
                        
                        if (progress > lastProgress + 5) { // Update setiap 5% peningkatan
                            lastProgress = progress;
                            const progressBar = '▰'.repeat(Math.floor(progress/10)) + '▱'.repeat(10 - Math.floor(progress/10));
                            
                            conn.sendMessage(m.chat, {
                                text: `🎬 *VIDEO ENHANCEMENT PREMIUM*\n\n${progressBar} ${progress}%\n📊 Status: Encoding...\n⚙️ CRF: 18 (Premium)\n⏱️ Waktu: ${Math.floor((Date.now() - startTime)/1000)} detik`,
                                edit: progressMsg.key
                            }).catch(() => {});
                        }
                    }
                }
            });
            
            ffmpegProcess.on('close', (code) => {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                if (code === 0) {
                    console.log(chalk.green(`✅ FFmpeg completed in ${elapsed}s`));
                    resolve();
                } else {
                    console.log(chalk.red(`❌ FFmpeg failed with code ${code}`));
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });
            
            ffmpegProcess.on('error', (err) => {
                console.log(chalk.red('❌ FFmpeg spawn error:'), err);
                reject(err);
            });
            
            // Timeout setelah 15 menit (karena premium quality lebih lama)
            setTimeout(() => {
                ffmpegProcess.kill();
                reject(new Error('FFmpeg timeout setelah 15 menit'));
            }, 15 * 60 * 1000);
        });
        
        // Update progress selesai
        await conn.sendMessage(m.chat, {
            text: `✅ *Proses Encoding Selesai!*\n\n▰▰▰▰▰▰▰ 100%\n📊 Status: Mengirim hasil...\n🎬 Video Premium siap!`,
            edit: progressMsg.key
        });
        
        // Kirim video hasil
        const processedVideo = await fs.promises.readFile(outputPath);
        const fileSize = (processedVideo.length / (1024 * 1024)).toFixed(2);
        const stats = fs.statSync(outputPath);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        console.log(chalk.green('════════════════════════════════════════════════════'));
        console.log(chalk.green(`🎉 PREMIUM PROCESS COMPLETED SUCCESSFULLY!`));
        console.log(chalk.green(`📊 File size: ${fileSize} MB`));
        console.log(chalk.green(`⏱️ Total time: ${duration} seconds`));
        console.log(chalk.green(`⚡ Quality: CRF 18 (Premium)`));
        console.log(chalk.green('════════════════════════════════════════════════════'));
        
        // Hapus pesan progress
        await conn.sendMessage(m.chat, { delete: progressMsg.key });
        
        // Kirim video dengan caption menarik
        await conn.sendMessage(m.chat, {
            video: processedVideo,
            caption: `✨ *PREMIUM VIDEO ENHANCEMENT COMPLETE!* ✨\n\n` +
                    `╔══════════════════════════════════╗\n` +
                    `║        🏆 PREMIUM STATS         ║\n` +
                    `╠══════════════════════════════════╣\n` +
                    `║ 📏 Size: ${fileSize} MB\n` +
                    `║ ⏱️ Time: ${duration}s\n` +
                    `║ 🎬 Codec: H.264 High Profile\n` +
                    `║ ✨ Quality: CRF 18 (Premium)\n` +
                    `║ 📱 Ready: WhatsApp Story\n` +
                    `╚══════════════════════════════════╝\n\n` +
                    `✅ *Premium Features Applied:*\n` +
                    `├ ⚡ Anti-Compression Technology\n` +
                    `├ 🎨 Maximum Clarity & Detail\n` +
                    `├ 📈 Smart Aspect Ratio Preservation\n` +
                    `├ 🔧 Film-Tuned Encoding\n` +
                    `└ 🛡️ WhatsApp Optimized\n\n` +
                    `Video optimized for WhatsApp with maximum quality preservation!`,
            fileName: `premium_enhanced_${Date.now()}.mp4`,
            mimetype: 'video/mp4'
        }, { quoted: m });
        
        // Cleanup
        await Promise.all([
            fs.promises.unlink(inputPath).catch(() => {}),
            fs.promises.unlink(outputPath).catch(() => {})
        ]);
        
        console.log(chalk.green('🗑️ Temporary files cleaned up'));
        console.log(chalk.cyan('════════════════════════════════════════════════════\n'));
        
    } catch (error) {
        console.error(chalk.red('\n❌ PREMIUM PROCESS FAILED:'));
        console.error(chalk.red(error.stack || error.message));
        console.log(chalk.cyan('════════════════════════════════════════════════════\n'));
        
        try {
            // Hapus pesan progress jika error
            if (progressMsg) {
                await conn.sendMessage(m.chat, { delete: progressMsg.key });
            }
            if (progressInterval) {
                clearInterval(progressInterval);
            }
        } catch {}
        
        m.reply(`❌ *PROSES PREMIUM GAGAL!*\n\n${error.message}\n\n🔧 *Troubleshooting:*\n• Pastikan FFmpeg terinstall\n• Video tidak corrupt\n• Server memiliki cukup resources\n• Coba video lebih kecil terlebih dahulu\n• Hubungi owner jika masalah berlanjut`);
    }
};

handler.help = ['to8k', 'enhance', 'upvideo', 'premium'];
handler.tags = ['tools'];
handler.command = /^(to8k|enhance|upvideo|improve|hd|quality|premium)$/i;
handler.limit = true;
handler.premium = false;
handler.register = false;

export default handler;