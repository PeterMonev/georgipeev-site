namespace GeorgiPeev.Web.Features.Photos;

/// <summary>The "Photos" section of configuration.</summary>
public sealed class PhotoOptions
{
    public const string Section = "Photos";

    /// <summary>"Disk" (the default) or "R2". Decides which IPhotoStorage is registered.</summary>
    public string Storage { get; set; } = "Disk";

    /// <summary>Folder for DiskPhotoStorage; relative paths are under the content root.</summary>
    public string DiskRoot { get; set; } = "App_Data/media";

    /// <summary>Uploads above this are refused before a byte is decoded.</summary>
    public long MaxUploadBytes { get; set; } = 20 * 1024 * 1024;

    /// <summary>Only read when Storage is "R2". Lives in User Secrets and environment variables, never in a file.</summary>
    public R2Options? R2 { get; set; }

    public bool UsesR2 => string.Equals(Storage, "R2", StringComparison.OrdinalIgnoreCase);

    public sealed class R2Options
    {
        /// <summary>https://&lt;account-id&gt;.r2.cloudflarestorage.com</summary>
        public string Endpoint { get; set; } = "";
        public string Bucket { get; set; } = "";
        public string AccessKey { get; set; } = "";
        public string SecretKey { get; set; } = "";
        /// <summary>Where browsers fetch from: the r2.dev URL now, media.georgipeev.bg later.</summary>
        public string PublicBaseUrl { get; set; } = "";

        public bool IsComplete =>
            Endpoint != "" && Bucket != "" && AccessKey != "" && SecretKey != "" && PublicBaseUrl != "";
    }
}
