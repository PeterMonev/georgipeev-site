namespace GeorgiPeev.Web.Features.Photos;

/// <summary>The "Photos" section of configuration.</summary>
public sealed class PhotoOptions
{
    public const string Section = "Photos";

    /// <summary>Folder for DiskPhotoStorage; relative paths are under the content root.</summary>
    public string DiskRoot { get; set; } = "App_Data/media";

    /// <summary>Uploads above this are refused before a byte is decoded.</summary>
    public long MaxUploadBytes { get; set; } = 20 * 1024 * 1024;
}
