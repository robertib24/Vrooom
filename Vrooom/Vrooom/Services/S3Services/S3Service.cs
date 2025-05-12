using Amazon.S3.Model;
using Amazon.S3;
namespace Vrooom.Services.S3Services
{
    public class S3Service : IS3Service
    {
        private readonly IAmazonS3 _amazonS3;
        private readonly string _bucket;

        public S3Service(IAmazonS3 amazonS3, string bucket)
        {
            _amazonS3 = amazonS3;
            _bucket = bucket;
        }


        public async Task UploadFileAsync(string key, IFormFile poza)
        {
            using (var ms = new MemoryStream())
            {
                await poza.CopyToAsync(ms);
                ms.Seek(0, SeekOrigin.Begin);
                var request = new PutObjectRequest
                {
                    BucketName = _bucket,
                    Key = key,
                    InputStream = ms,
                    ContentType = "image/png"
                };

                await _amazonS3.PutObjectAsync(request);
            }

        }

        public async Task DeleteFileAsync(string key)
        {
            await _amazonS3.DeleteObjectAsync(_bucket, key);
        }
        public string GetFileUrl(string key)
        {
            return $"https://{_bucket}.s3.amazonaws.com/{key}";
        }
    }
}
