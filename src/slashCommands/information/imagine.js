const { SlashCommandBuilder, EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const config = require("../../config/config.json")


module.exports = {
    name: "imagine",
    description: "Generate art in your dreams!",
    options: [
        {
            name: "prompt",
            description: "Your prompt to generate the art",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    run: async (client, interaction, args) => {
        await interaction.deferReply()
        
        const prompt = interaction.options.getString("prompt")
        
        // Input validation
        if (!prompt || prompt.trim().length === 0) {
            return await interaction.editReply({ 
                content: "❌ Please provide a valid prompt for image generation." 
            })
        }
        
        if (prompt.length > 500) {
            return await interaction.editReply({ 
                content: "❌ Prompt is too long. Please keep it under 500 characters." 
            })
        }

        // Sanitize prompt (basic cleanup)
        const sanitizedPrompt = prompt.trim().replace(/[<>]/g, '');
        
        const Replicate = require('replicate')

        const replicate = new Replicate({
            auth: config.API,
        });

        try {
            // Check if API key is configured
            if (!config.API || config.API === "YOUR REPLICATE API KEY") {
                return await interaction.editReply({ 
                    content: "❌ Bot configuration error. Please contact the administrator." 
                })
            }

            const output = await replicate.run("stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf", {
                input: {
                    prompt: sanitizedPrompt
                }
            })

            // Validate API response
            if (!output || typeof output !== 'string' || !output.startsWith('http')) {
                return await interaction.editReply({ 
                    content: "❌ Failed to generate image. The API returned an invalid response. Please try again." 
                })
            }

            // Additional URL validation
            try {
                new URL(output);
            } catch (urlError) {
                return await interaction.editReply({ 
                    content: "❌ Generated image URL is invalid. Please try again." 
                })
            }
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setLabel(`Download`)
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${output}`),
                   new ButtonBuilder()
                    .setLabel(`Support Us`)
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://paypal.me/officialrazer'))
                
            const embed = new EmbedBuilder()
                .setTitle("**Your Prompt:**")
                .setDescription(`**${sanitizedPrompt}**`)
                .setImage(`${output}`)
                .setColor('#2f3136')
                .setFooter({ text: `Requested by: ${interaction.user.username} | ©️ Project Razer `,
                                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                              })

            await interaction.editReply({ embeds: [embed], components: [row] })
            
        } catch (error) {
            console.error('Replicate API error:', error);
            
            // Handle specific error types
            if (error.message && error.message.includes('rate limit')) {
                return await interaction.editReply({ 
                    content: "❌ Too many requests. Please wait a moment before trying again." 
                })
            }
            
            if (error.message && error.message.includes('authentication')) {
                return await interaction.editReply({ 
                    content: "❌ API authentication failed. Please contact the administrator." 
                })
            }
            
            if (error.message && error.message.includes('timeout')) {
                return await interaction.editReply({ 
                    content: "❌ Request timed out. The image generation is taking longer than expected. Please try again." 
                })
            }
            
            // Generic error message
            return await interaction.editReply({ 
                content: "❌ An error occurred while generating the image. Please try again later." 
            })
        }
    }
}
