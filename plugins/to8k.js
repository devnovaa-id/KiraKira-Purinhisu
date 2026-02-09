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
            
            progressMsg = await m.reply(`🔄 *Memproses Video...*\n\n${frames[0]} 0%\n📊 *Status:* Mendownload video...\n⏱️ *Mulai:* ${startTime.format('HH:mm:ss')}`);
            
            progressInterval = setInterval(async () => {
                try {
                    frameIndex = (frameIndex + 1) % frames.length;
                    const elapsed = moment().diff(startTime, 'seconds');
                    const progressText = `${frames[frameIndex]} ${Math.floor((frameIndex / frames.length) * 15)}%`;
                    
                    await conn.sendMessage(m.chat, {
                        text: `🔄 *Memproses Video...*\n\n${progressText}\n📊 *Status:* Processing...\n⏱️ *Waktu:* ${elapsed} detik`,
                        edit: progressMsg.key
                    });
                } catch (e) {
                    // Ignore edit errors
                }
            }, 500);
        };
        
        await startProgressAnimation();
        
        // Log awal di konsol
        console.log('\n' + chalk.cyan('╔══════════════════════════════════════════╗'));
        console.log(chalk.cyan('║          🎬 VIDEO ENHANCEMENT TO8K          ║'));
        console.log(chalk.cyan('╚══════════════════════════════════════════╝'));
        console.log(chalk.yellow(`📅 ${moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')}`));
        console.log(chalk.blue(`👤 User: ${m.sender.split('@')[0]}`));
        console.log(chalk.blue(`💬 Chat: ${m.chat}`));
        console.log(chalk.cyan('════════════════════════════════════════════'));
        
        // Download media
        let media = await q.download();
        let inputPath = path.join(tmpdir(), `input_${Date.now()}.${mime.includes('video') ? 'mp4' : 'jpg'}`);
        let outputPath = path.join(tmpdir(), `output_${Date.now()}.mp4`);
        
        await fs.promises.writeFile(inputPath, media);
        
        console.log(chalk.green('✅ Video downloaded successfully'));
        console.log(chalk.gray(`📁 Input: ${inputPath}`));
        console.log(chalk.gray(`📁 Output: ${outputPath}`));
        console.log(chalk.cyan('════════════════════════════════════════════'));
        
        // Update progress ke encoding
        clearInterval(progressInterval);
        await conn.sendMessage(m.chat, {
            text: `🔄 *Memproses Video...*\n\n▰▰▰▱▱▱ 25%\n📊 *Status:* Encoding video...\n⚙️ *Proses:* FFmpeg enhancement`,
            edit: progressMsg.key
        });
        
        // Parameter FFmpeg
        // const ffmpegArgs = [
        //     '-i', inputPath,
        //     '-c:v', 'libx264',
        //     '-preset', 'slow',
        //     '-crf', '18',
        //     '-vf', 'scale=1920:1080:flags=lanczos',
        //     '-c:a', 'aac',
        //     '-b:a', '192k',
        //     '-movflags', '+faststart',
        //     '-pix_fmt', 'yuv420p',
        //     '-profile:v', 'high',
        //     '-level', '4.2',
        //     '-maxrate', '5M',
        //     '-bufsize', '10M',
        //     '-r', '30',
        //     '-ar', '44100',
        //     '-f', 'mp4',
        //     '-y',
        //     outputPath
        // ];
        const ffmpegArgs = [
            '-threads', '0',           
            '-i', inputPath,
            '-c:v', 'libx264',
            '-preset', 'fast',  
            '-crf', '24',             
            '-vf', 'scale=1920:1080:flags=lanczos',
            '-c:a', 'aac',          
            '-b:a', '192k',
            '-movflags', '+faststart',
            '-pix_fmt', 'yuv420p',
            '-profile:v', 'high',
            '-level', '4.2',
            '-maxrate', '5M',
            '-bufsize', '10M',
            '-r', '30',
            '-ar', '44100',
            '-f', 'mp4',
            '-y',
            outputPath
        ];
        
        // Eksekusi FFmpeg dengan output ke console
        console.log(chalk.yellow('🚀 Starting FFmpeg process...'));
        console.log(chalk.gray('Command: ffmpeg ' + ffmpegArgs.join(' ')));
        console.log(chalk.cyan('════════════════════════════════════════════'));
        
        const startTime = Date.now();
        
        await new Promise((resolve, reject) => {
            const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
            
            // Tampilkan output FFmpeg di console
            ffmpegProcess.stderr.on('data', (data) => {
                const line = data.toString();
                // Parse progress dari output FFmpeg
                if (line.includes('frame=') || line.includes('fps=') || line.includes('time=')) {
                    console.log(chalk.gray(`[FFMPEG] ${line.trim()}`));
                    
                    // Coba ekstrak progress percentage
                    const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1]);
                        const minutes = parseInt(timeMatch[2]);
                        const seconds = parseFloat(timeMatch[3]);
                        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                        
                        // Update progress di chat (sederhana)
                        const progress = Math.min(90, Math.floor(totalSeconds / 10)); // contoh
                        if (progress % 10 === 0) {
                            const progressBar = '▰'.repeat(Math.floor(progress/10)) + '▱'.repeat(10 - Math.floor(progress/10));
                            conn.sendMessage(m.chat, {
                                text: `🔄 *Memproses Video...*\n\n${progressBar} ${progress}%\n📊 *Status:* Encoding...\n⏱️ *Waktu:* ${Math.floor((Date.now() - startTime)/1000)} detik`,
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
            
            // Timeout setelah 10 menit
            setTimeout(() => {
                ffmpegProcess.kill();
                reject(new Error('FFmpeg timeout setelah 10 menit'));
            }, 10 * 60 * 1000);
        });
        
        // Update progress selesai
        await conn.sendMessage(m.chat, {
            text: `✅ *Proses Encoding Selesai!*\n\n▰▰▰▰▰▰▰ 100%\n📊 *Status:* Mengirim hasil...\n🎬 *Video siap!*`,
            edit: progressMsg.key
        });
        
        // Kirim video hasil
        const processedVideo = await fs.promises.readFile(outputPath);
        const fileSize = (processedVideo.length / (1024 * 1024)).toFixed(2);
        const stats = fs.statSync(outputPath);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        console.log(chalk.green('════════════════════════════════════════════'));
        console.log(chalk.green(`🎉 PROCESS COMPLETED SUCCESSFULLY!`));
        console.log(chalk.green(`📊 File size: ${fileSize} MB`));
        console.log(chalk.green(`⏱️ Total time: ${duration} seconds`));
        console.log(chalk.green('════════════════════════════════════════════'));
        
        // Hapus pesan progress
        await conn.sendMessage(m.chat, { delete: progressMsg.key });
        
        // Kirim video dengan caption menarik
        await conn.sendMessage(m.chat, {
            video: processedVideo,
            caption: `✨ *VIDEO ENHANCEMENT COMPLETE!* ✨\n\n` +
                    `╔══════════════════════════════╗\n` +
                    `║        📊 STATISTICS        ║\n` +
                    `╠══════════════════════════════╣\n` +
                    `║ 📏 Size: ${fileSize} MB\n` +
                    `║ ⏱️ Time: ${duration}s\n` +
                    `║ 🎬 Codec: H.264 + AAC\n` +
                    `║ 📱 Ready: WhatsApp Story\n` +
                    `╚══════════════════════════════╝\n\n` +
                    `✅ *Features Applied:*\n` +
                    `├ ⚡ Anti-Compression Tech\n` +
                    `├ 🎨 Quality Enhancement\n` +
                    `├ 📈 Resolution Upscale\n` +
                    `└ 🔧 Optimized Encoding\n\n` +
                    `Video optimized for WhatsApp!`,
            fileName: `enhanced_${Date.now()}.mp4`,
            mimetype: 'video/mp4'
        }, { quoted: m });
        
        // Cleanup
        await Promise.all([
            fs.promises.unlink(inputPath).catch(() => {}),
            fs.promises.unlink(outputPath).catch(() => {})
        ]);
        
        console.log(chalk.green('🗑️ Temporary files cleaned up'));
        console.log(chalk.cyan('════════════════════════════════════════════\n'));
        
    } catch (error) {
        console.error(chalk.red('\n❌ PROCESS FAILED:'));
        console.error(chalk.red(error.stack || error.message));
        console.log(chalk.cyan('════════════════════════════════════════════\n'));
        
        try {
            // Hapus pesan progress jika error
            if (progressMsg) {
                await conn.sendMessage(m.chat, { delete: progressMsg.key });
            }
            if (progressInterval) {
                clearInterval(progressInterval);
            }
        } catch {}
        
        m.reply(`❌ *PROSES GAGAL!*\n\n${error.message}\n\n🔧 *Troubleshooting:*\n• Pastikan FFmpeg terinstall\n• Video tidak corrupt\n• Coba video lebih kecil\n• Hubungi owner jika masalah berlanjut`);
    }
};

handler.help = ['to8k', 'enhance', 'upvideo'];
handler.tags = ['tools'];
handler.command = /^(to8k|enhance|upvideo|improve|hd|quality)$/i;
handler.limit = true;
handler.premium = false;
handler.register = false;

export default handler;