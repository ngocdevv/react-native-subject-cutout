#import "RNSubjectCutout.h"

#import <CoreImage/CoreImage.h>
#import <Vision/Vision.h>

@implementation RNSubjectCutout

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0);
}

RCT_REMAP_METHOD(extractSubjects,
                 extractSubjectsFromURI:(NSString *)uriString
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (@available(iOS 17.0, *)) {
    NSURL *url = [NSURL URLWithString:uriString];
    if (url == nil || !url.isFileURL) {
      reject(@"E_UNSUPPORTED_URI", @"extractSubjects accepts a local file:// image URI.", nil);
      return;
    }

    NSError *error = nil;
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithURL:url options:@{}];

    VNGenerateForegroundInstanceMaskRequest *request = [VNGenerateForegroundInstanceMaskRequest new];
    BOOL didPerform = [handler performRequests:@[request] error:&error];
    VNInstanceMaskObservation *observation = request.results.firstObject;
    if (!didPerform || error != nil || observation == nil || observation.allInstances.count == 0) {
      reject(@"E_NO_SUBJECT", @"No foreground subject was detected in this image.", error);
      return;
    }

    NSMutableArray<NSDictionary *> *subjects = [NSMutableArray array];
    __block NSError *writeError = nil;
    __block NSUInteger outputIndex = 0;
    [observation.allInstances enumerateIndexesUsingBlock:^(NSUInteger index, BOOL *stop) {
      NSIndexSet *instance = [NSIndexSet indexSetWithIndex:index];
      CVPixelBufferRef maskedBuffer = [observation generateMaskedImageOfInstances:instance
                                                                fromRequestHandler:handler
                                                            croppedToInstancesExtent:YES
                                                                             error:&writeError];
      if (maskedBuffer == nil || writeError != nil) {
        *stop = YES;
        return;
      }

      NSDictionary *subject = [self writeMaskedPixelBuffer:maskedBuffer index:outputIndex error:&writeError];
      CVPixelBufferRelease(maskedBuffer);
      if (subject == nil || writeError != nil) {
        *stop = YES;
        return;
      }
      [subjects addObject:subject];
      outputIndex += 1;
    }];

    if (writeError != nil) {
      reject(@"E_OUTPUT_WRITE_FAILED", @"Unable to create the transparent PNG.", writeError);
      return;
    }
    if (subjects.count == 0) {
      reject(@"E_NO_SUBJECT", @"No foreground subject was detected in this image.", nil);
      return;
    }
    resolve(@{ @"subjects": subjects });
  } else {
    reject(@"E_UNSUPPORTED_OS", @"Subject extraction requires iOS 17 or later.", nil);
  }
}

RCT_REMAP_METHOD(clearCache,
                 clearCacheWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSError *error = nil;
  [[NSFileManager defaultManager] removeItemAtURL:[self outputDirectory] error:&error];
  if (error != nil && error.code != NSFileNoSuchFileError) {
    reject(@"E_CACHE_CLEAR_FAILED", @"Unable to clear subject cutout cache.", error);
    return;
  }
  resolve(nil);
}

- (NSDictionary *)writeMaskedPixelBuffer:(CVPixelBufferRef)pixelBuffer
                                    index:(NSUInteger)index
                                    error:(NSError **)error
{
  CIImage *image = [CIImage imageWithCVPixelBuffer:pixelBuffer];
  CIContext *context = [CIContext contextWithOptions:nil];
  CGImageRef cgImage = [context createCGImage:image fromRect:image.extent];
  if (cgImage == nil) {
    if (error != NULL) {
      *error = [NSError errorWithDomain:@"RNSubjectCutout"
                                    code:1
                                userInfo:@{NSLocalizedDescriptionKey: @"Unable to create output image."}];
    }
    return nil;
  }

  UIImage *outputImage = [UIImage imageWithCGImage:cgImage];
  CGImageRelease(cgImage);
  NSData *pngData = UIImagePNGRepresentation(outputImage);
  NSURL *directory = [self outputDirectory];
  if (![[NSFileManager defaultManager] createDirectoryAtURL:directory
                                withIntermediateDirectories:YES
                                                 attributes:nil
                                                      error:error]) {
    return nil;
  }

  NSURL *fileURL = [directory URLByAppendingPathComponent:[NSString stringWithFormat:@"subject-%@.png", NSUUID.UUID.UUIDString]];
  if (![pngData writeToURL:fileURL options:NSDataWritingAtomic error:error]) {
    return nil;
  }

  return @{
    @"index": @(index),
    @"uri": fileURL.absoluteString,
    @"width": @(CGImageGetWidth(outputImage.CGImage)),
    @"height": @(CGImageGetHeight(outputImage.CGImage))
  };
}

- (NSURL *)outputDirectory
{
  NSURL *cacheDirectory = [[[NSFileManager defaultManager] URLsForDirectory:NSCachesDirectory
                                                                   inDomains:NSUserDomainMask] firstObject];
  return [cacheDirectory URLByAppendingPathComponent:@"rn-subject-cutout" isDirectory:YES];
}

@end
