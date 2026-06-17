'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadPhoto(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, message: 'No file uploaded' };
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      return { success: false, message: 'S3 bucket name not configured' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const key = `photos/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      // ACL: 'public-read' // Only uncomment if bucket allows ACLs
    });

    await s3Client.send(command);

    // The public URL assuming the bucket is public or we have a CloudFront distribution
    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${key}`;

    const photo = await prisma.photo.create({
      data: {
        imageUrl,
      }
    });

    revalidatePath('/itinerary');
    revalidatePath('/admin/photos');
    return { success: true, photo };
  } catch (error: any) {
    console.error("Failed to upload photo:", error);
    return { success: false, message: error.message };
  }
}

export async function getPhotos() {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: photos };
  } catch (error: any) {
    console.error("Failed to fetch photos:", error);
    return { success: false, message: error.message };
  }
}

export async function deletePhoto(id: string) {
  try {
    await prisma.photo.delete({
      where: { id }
    });
    // Note: We are keeping the file in S3 for safety, or you can add DeleteObjectCommand here.
    revalidatePath('/itinerary');
    revalidatePath('/admin/photos');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete photo:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteAllPhotos(password: string) {
  try {
    if (password !== 'godisgoodallthetime') {
      return { success: false, message: 'Invalid password' };
    }
    
    await prisma.photo.deleteMany({});
    
    revalidatePath('/itinerary');
    revalidatePath('/admin/photos');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete all photos:", error);
    return { success: false, message: error.message };
  }
}
